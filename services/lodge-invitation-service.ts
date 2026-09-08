import { supabase } from '@/lib/supabase';
import { chunkInIds, fetchProfilesInChunks } from '@/utils/profile-chunking';
import { derivePropertyTier, isValidTargetOccupancy } from '@/utils/liquidity-math';
import { resolveEstateForListing } from '@/utils/liquidity-estate';
import { currentUserId, joinPodByCode, SIGN_IN_REQUIRED_MESSAGE } from '@/services/liquidity-pod-service';
import type { PurchaseSlotCreditResult } from '@/services/liquidity-pod-service';
import type { SlotCredit , PendingLodgeInvitation } from '@/types/liquidity';

import type { DbListing } from '@/types/feed-listing';

const POD_COLUMNS = 'id, group_code, listing_id, property_tier, target_occupancy, current_total_intent';

async function fetchDbListing(listingId: string): Promise<DbListing> {
  const { data, error } = await supabase.from('listings').select('*').eq('id', listingId).maybeSingle();
  if (error || !data) {
    console.error('[LodgeInvitations] Failed to load invited listing:', error?.message ?? 'not found');
    throw new Error("We couldn't load this lodge. Try again later.");
  }
  return data as DbListing;
}

async function attachInviterInfo(rows: PendingLodgeInvitation[]): Promise<PendingLodgeInvitation[]> {
  const inviterIds = [...new Set(rows.map((row) => row.inviter_user_id).filter((id) => Boolean(id)))];
  const inviteeIds = [...new Set(rows.map((row) => row.invitee_user_id).filter((id): id is string => Boolean(id)))];
  const listingIds = [...new Set(rows.map((row) => row.pod.listing_id).filter((id): id is string => Boolean(id)))];

  try {
    const [{ data: inviterProfiles }, { data: existingCredits }] = await Promise.all([
      inviterIds.length > 0
        ? fetchProfilesInChunks(inviterIds)
        : { data: null, error: null } as const,
      inviteeIds.length > 0 && listingIds.length > 0
        ? supabase.from('slot_credits').select('user_id, listing_id').in('user_id', inviteeIds).in('listing_id', listingIds).neq('status', 'expired')
        : Promise.resolve({ data: null, error: null } as const),
      listingIds.length > 0
        ? (async () => {
            const chunks = chunkInIds(listingIds);
            const listingsMap: Map<string, DbListing> = new Map();
            for (const chunk of chunks) {
              const { data } = await supabase.from('listings').select('*').in('id', chunk);
              for (const row of (data as DbListing[] | null) ?? []) {
                listingsMap.set(row.id, row);
              }
            }
            return { data: Array.from(listingsMap.values()), error: null };
          })()
        : Promise.resolve({ data: null, error: null } as const),
    ]);

    type InviterProfile = { full_name?: string | null; gender?: string | null };
    const profiles = inviterProfiles ?? {};
    const names = new Map<string, string | null>();
    const genders = new Map<string, string | null>();
    for (const [id, value] of Object.entries(profiles)) {
      const info = (value ?? {}) as InviterProfile;
      names.set(id, info.full_name ?? null);
      genders.set(id, info.gender ?? null);
    }
    type CreditRow = { user_id: string; listing_id: string };
    const existingSlotKeys = new Set(
      (existingCredits as CreditRow[] | null ?? []).map((c) => `${c.user_id}:${c.listing_id}`),
    );

    return rows.map((row) => {
      const inviterId = row.inviter_user_id;
      const listingId = row.pod.listing_id;
      const inviteeId = row.invitee_user_id;
      const gender = inviterId ? genders.get(inviterId) : null;
      return {
        ...row,
        inviter_name: (inviterId ? names.get(inviterId) : null) ?? null,
        inviterGender: (gender === 'MALE' || gender === 'FEMALE' ? gender : null) ?? null,
        hasExistingSlot: Boolean(inviteeId && listingId && existingSlotKeys.has(`${inviteeId}:${listingId}`)),
      };
    });
  } catch (error) {
    console.error('[LodgeInvitations] Exception while loading inviter info:', error);
    return rows;
  }
}

export async function fetchMyPendingInvitations(): Promise<PendingLodgeInvitation[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('pod_invitations')
      .select(`*, pod:pods(${POD_COLUMNS})`)
      .eq('invitee_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[LodgeInvitations] Failed to fetch invitations:', error);
      return [];
    }
    return await attachInviterInfo((data ?? []) as PendingLodgeInvitation[]);
  } catch (error) {
    console.error('[LodgeInvitations] Exception while fetching invitations:', error);
    return [];
  }
}

export async function respondToLodgeInvitation(invitationId: string, status: 'accepted' | 'declined'): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error(SIGN_IN_REQUIRED_MESSAGE);
  try {
    const { error } = await supabase
      .from('pod_invitations')
      .update({ status })
      .eq('id', invitationId)
      .eq('invitee_user_id', userId);
    if (error) throw new Error(`Failed to update invitation status: ${error.message}`);
  } catch (error) {
    console.error('[LodgeInvitations] Exception while updating invitation:', error);
    throw error;
  }
}

export async function acceptLodgeInvitation(invitation: PendingLodgeInvitation, listing?: DbListing): Promise<PurchaseSlotCreditResult> {
  const userId = await currentUserId();
  if (!userId) throw new Error(SIGN_IN_REQUIRED_MESSAGE);

  const listingId = invitation.pod.listing_id;
  if (!listingId) throw new Error('This invite is missing its lodge details.');
  if (!invitation.pod.group_code) throw new Error('This invite is missing its group code.');

  const dbListing = listing ?? (await fetchDbListing(listingId));
  const propertyTier = derivePropertyTier(dbListing.property_tier, dbListing.max_roommates);
  const targetOccupancy = invitation.pod.target_occupancy || invitation.pod.property_tier;
  if (!isValidTargetOccupancy(propertyTier, targetOccupancy)) {
    throw new Error(`Invalid occupancy ${targetOccupancy} for a ${propertyTier}-slot property.`);
  }

  const existingCredit = await findActiveSlotCreditForListing(userId, listingId);
  if (existingCredit) {
    await expireAndRemoveFromPod(userId, existingCredit, listingId, targetOccupancy);
  }

  const { estateId, estate } = await resolveEstateForListing(dbListing);
  const result = await joinPodByCode({ code: invitation.pod.group_code, listing: dbListing, estate, estateId, propertyTier });
  await respondToLodgeInvitation(invitation.id, 'accepted');
  return result;
}

async function findActiveSlotCreditForListing(userId: string, listingId: string): Promise<SlotCredit | null> {
  try {
    const { data, error } = await supabase
      .from('slot_credits')
      .select('*')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .neq('status', 'expired')
      .maybeSingle();
    if (error || !data) return null;
    return data as SlotCredit;
  } catch (error) {
    console.error('[LodgeInvitations] Failed to find active slot credit:', error);
    return null;
  }
}

async function expireAndRemoveFromPod(userId: string, credit: SlotCredit, listingId: string, targetOccupancy: number): Promise<void> {
  try {
    console.log('[LodgeInvitations] Swap detected — expiring old credit:', credit.id);

    await supabase.from('slot_credits').update({ status: 'expired' }).eq('id', credit.id);

    const { data: oldPodMember } = await supabase
      .from('pod_members')
      .select('pod_id')
      .eq('user_id', userId)
      .eq('slot_credit_id', credit.id)
      .maybeSingle();

    if (oldPodMember?.pod_id) {
      await supabase.from('pod_members').delete().eq('pod_id', oldPodMember.pod_id).eq('user_id', userId);

      const { data: remainingMembers } = await supabase
        .from('pod_members')
        .select('intent_size')
        .eq('pod_id', oldPodMember.pod_id);

      const nextIntent = (remainingMembers ?? []).reduce((sum, m) => sum + Math.max(0, m.intent_size ?? 1), 0);
      await supabase
        .from('pods')
        .update({ current_total_intent: nextIntent, is_finalized: nextIntent >= targetOccupancy })
        .eq('id', oldPodMember.pod_id);
    }

    console.log('[LodgeInvitations] Old slot expired and pod reconciled successfully.');
  } catch (error) {
    console.error('[LodgeInvitations] Failed to expire old slot and reconcile pod:', error);
    throw new Error('Your previous reservation has been expired. Please accept the new invite again.');
  }
}
