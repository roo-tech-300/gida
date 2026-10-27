import { supabase } from '@/lib/supabase';
import type { DbListing } from '@/types/feed-listing';
import type { Pod, PodMember } from '@/types/liquidity';
import type { PodMatchContext, RecommendedPod } from '@/types/pod-recommendation';
import { rankPods } from '@/utils/pod-ranking';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Upper bound on pods scanned per fetch. Keeps the feed light as the table grows. */
const MAX_PODS_SCAN = 50;

/** Enough pods to fill several shelves before more are needed. */
const PODS_PER_FEED = 18;

/** Pods older than this are almost certainly abandoned; don't recommend them. */
const POD_FRESHNESS_DAYS = 30;

type PodRow = Pod & { members: PodMember[] };

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  gender: 'MALE' | 'FEMALE' | null;
};

type InvitationRow = {
  id: string;
  pod_id: string;
  invitee_name: string;
};

type ListingRow = DbListing & { price_amount: number | string };

async function fetchProfiles(pods: readonly PodRow[]): Promise<ProfileRow[]> {
  const userIds = [
    ...new Set(
      pods
        .flatMap((pod) => pod.members.map((member) => member.user_id))
        .filter((id) => !id.startsWith('inv-')),
    ),
  ];
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, gender')
    .in('id', userIds);

  if (error) {
    console.error('[PodRecommendations] Failed to load member profiles:', error.message);
    return [];
  }
  return (data ?? []) as ProfileRow[];
}

async function fetchInvitations(podIds: readonly string[]): Promise<InvitationRow[]> {
  if (podIds.length === 0) return [];

  const { data, error } = await supabase
    .from('pod_invitations')
    .select('id, pod_id, invitee_name')
    .in('pod_id', podIds)
    .eq('status', 'pending');

  if (error) {
    console.error('[PodRecommendations] Failed to load pod invitations:', error.message);
    return [];
  }
  return (data ?? []) as InvitationRow[];
}

async function fetchListings(pods: readonly PodRow[]): Promise<Map<string, DbListing>> {
  const listingIds = [
    ...new Set(pods.map((pod) => pod.listing_id).filter((id): id is string => !!id)),
  ];
  if (listingIds.length === 0) return new Map();

  // The join sheet hands this row straight to `purchaseSlotCredit`, so the
  // shelf needs the whole listing rather than a display-only projection.
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .in('id', listingIds);

  if (error) {
    console.error('[PodRecommendations] Failed to load pod listings:', error.message);
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ListingRow[];
  return new Map(
    rows.map((row) => [row.id, { ...row, price_amount: Number(row.price_amount) || 0 }]),
  );
}

function attachProfiles(pods: PodRow[], profiles: readonly ProfileRow[]): void {
  const byId = new Map(profiles.map((profile) => [profile.id, profile]));

  for (const pod of pods) {
    for (const member of pod.members) {
      const profile = byId.get(member.user_id);
      if (!profile) continue;

      member.profile = {
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        gender: profile.gender,
      };
      if (!member.full_name) member.full_name = profile.full_name ?? '';
      if (!member.avatar_url) member.avatar_url = profile.avatar_url ?? undefined;
    }
  }
}

/**
 * Pending invites occupy a seat, so they must appear as members or the shelf
 * would offer seats that are already promised to someone else.
 */
function attachInvitations(pods: PodRow[], invitations: readonly InvitationRow[]): void {
  const byPod = new Map<string, InvitationRow[]>();
  for (const invitation of invitations) {
    const bucket = byPod.get(invitation.pod_id) ?? [];
    bucket.push(invitation);
    byPod.set(invitation.pod_id, bucket);
  }

  for (const pod of pods) {
    const invites = byPod.get(pod.id) ?? [];
    if (invites.length === 0) continue;

    const inviteMembers: PodMember[] = invites.map((invite) => ({
      user_id: `inv-${invite.id}`,
      full_name: invite.invitee_name,
      intent_size: 1,
      campus: '',
      major: '',
      cleanliness_score: 0,
      sleep_schedule: '',
      slot_credit_id: 'invitation',
    }));

    pod.members = [...pod.members, ...inviteMembers];
  }
}

async function fetchOpenPodRows(): Promise<PodRow[]> {
  const freshAfter = new Date(Date.now() - POD_FRESHNESS_DAYS * DAY_MS).toISOString();

  const { data, error } = await supabase
    .from('pods')
    .select('*, members:pod_members(*)')
    .eq('is_finalized', false)
    .not('listing_id', 'is', null)
    .gte('created_at', freshAfter)
    .order('created_at', { ascending: false })
    .limit(MAX_PODS_SCAN);

  if (error) throw new Error(error.message);

  // `verification_status` can be NULL on legacy rows, which a SQL `neq` would
  // drop — filter rejected pods in JS instead.
  return ((data ?? []) as PodRow[]).filter((pod) => pod.verification_status !== 'rejected');
}

/**
 * Pods a viewer can actually join right now, best match first.
 *
 * Uses a bounded, feed-shaped hydration (two batch queries) instead of
 * `enrichPods`, whose per-pod invitation lookups are too chatty for a feed.
 */
export async function fetchRecommendedPods(ctx: PodMatchContext): Promise<RecommendedPod[]> {
  if (!ctx.userId) return [];

  try {
    const pods = await fetchOpenPodRows();
    if (pods.length === 0) return [];

    const podIds = pods.map((pod) => pod.id);
    const [profiles, invitations, listingById] = await Promise.all([
      fetchProfiles(pods),
      fetchInvitations(podIds),
      fetchListings(pods),
    ]);

    attachProfiles(pods, profiles);
    attachInvitations(pods, invitations);

    const withListing = pods
      .map((pod) => {
        const listing = pod.listing_id ? listingById.get(pod.listing_id) : undefined;
        return listing ? { ...pod, listing } : null;
      })
      .filter((pod): pod is PodRow & { listing: DbListing } => pod !== null);

    return rankPods(withListing, ctx, { limit: PODS_PER_FEED });
  } catch (error) {
    console.error('[PodRecommendations] Failed to load recommended pods:', error);
    throw error instanceof Error ? error : new Error('Could not load pod recommendations.');
  }
}
