import { supabase } from '@/lib/supabase';
import { PAYMENT_WINDOW_MS } from '@/utils/liquidity-math';
import { memberAmount, assertRevenueParity } from '@/utils/liquidity-pricing';
import { persistFounderPod } from '@/services/liquidity-pod-persistence';
import { sendRoommateInviteDm } from '@/services/roommate-invite-message';
import { notifyFounderOfJoiner, type PodJoinSource } from '@/services/pod-join-message';
import {
  PERSIST_FAILURE_MESSAGE,
  PodJoinError,
  applyRemoteCredit,
  joinPodViaRpc,
  joinPodViaWorker,
  podJoinErrorMessage,
} from '@/services/pod-join-remote';
import type { Estate, SlotCredit, Pod, PodMember, PodVerificationStatus } from '@/types/liquidity';
import type { DbListing } from '@/types/feed-listing';

export const SIGN_IN_REQUIRED_MESSAGE = 'Please sign in to continue.';

const SYNC_FAILURE_MESSAGE = PERSIST_FAILURE_MESSAGE;

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 12;

export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `GIDA-POD-${code}`;
}

export async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch (error) {
    console.error('[LiquidityService] Failed to resolve current user:', error);
    return null;
  }
}

function buildMember(userId: string, creditId: string, amountPaid?: number, name?: string): PodMember {
  return {
    user_id: userId,
    full_name: name || 'Roommate',
    intent_size: 1,
    campus: 'UNILAG (Main Campus)',
    major: 'Computer Science',
    cleanliness_score: 5,
    sleep_schedule: 'Midnight (12 AM)',
    slot_credit_id: creditId,
    amount_paid: amountPaid,
  };
}

function buildCredit(userId: string, estateId: string, estate: Estate, listingId: string, propertyTier: number, targetOccupancy: number, code: string): SlotCredit {
  return {
    id: `credit-dyn-${Date.now()}`,
    user_id: userId,
    estate_id: estateId,
    listing_id: listingId,
    property_tier: propertyTier,
    intent_size: 1,
    target_occupancy: targetOccupancy,
    status: 'booked_pending_claim',
    invite_code: code,
    created_at: new Date().toISOString(),
    payment_deadline: new Date(Date.now() + PAYMENT_WINDOW_MS).toISOString(),
    estate,
  };
}

export async function findPodByGroupCode(code: string): Promise<Pod | undefined> {
  const normalized = code.trim().toUpperCase();
  try {
    const { data, error } = await supabase
      .from('pods')
      .select('*, members:pod_members(*)')
      .eq('group_code', normalized)
      .maybeSingle();
    if (!error && data) return data as Pod;
  } catch (error) {
    console.error('[LiquidityService] Failed to find pod by group code:', error);
  }
  return undefined;
}

async function getPodById(podId: string): Promise<Pod> {
  const { data, error } = await supabase
    .from('pods')
    .select('*, members:pod_members(*)')
    .eq('id', podId)
    .maybeSingle();
  if (error || !data) {
    console.error('[LiquidityService] Failed to load pod:', error?.message ?? 'not found');
    throw new Error('Pod not found.');
  }
  return data as Pod;
}

export async function removeMemberFromPod(podId: string, targetUserId: string): Promise<Pod> {
  const userId = await currentUserId();
  if (!userId) throw new Error(SIGN_IN_REQUIRED_MESSAGE);

  const { data, error } = await supabase
    .rpc('remove_member_from_pod', { p_pod_id: podId, p_target_user_id: targetUserId });
  if (error) throw new Error(error.message);

  return data as Pod;
}

export type PurchaseSlotCreditResult = { credit: SlotCredit; podId: string; synced: boolean };

export async function joinPodByCode(args: { code: string; listing: DbListing; estate: Estate; estateId: string; propertyTier: number; source?: PodJoinSource }): Promise<PurchaseSlotCreditResult> {
  const userId = await currentUserId();
  if (!userId) throw new Error(SIGN_IN_REQUIRED_MESSAGE);

  const pod = await findPodByGroupCode(args.code);
  if (!pod) {
    throw new Error('Invite code not found. Ask your friend to share their invite code.');
  }

  // Self-healing guard: real member rows are the source of truth, never the
  // drift-prone current_total_intent counter.
  const target = pod.target_occupancy ?? args.propertyTier;
  const activeMembers = pod.members.filter((m) => (m.intent_size ?? 1) > 0);
  if (activeMembers.length >= target) {
    throw new Error('This group is already full. Pick another invite code or a lower occupancy.');
  }
  if (activeMembers.some((m) => m.user_id === userId)) {
    throw new PodJoinError('ALREADY_MEMBER', podJoinErrorMessage('ALREADY_MEMBER'));
  }

  const credit = buildCredit(userId, args.estateId, args.estate, args.listing.id, pod.property_tier, target, generateInviteCode());
  credit.amount_paid = memberAmount(args.listing.price_amount, target, activeMembers.length);

  const outcome = await joinPodViaWorker(pod.group_code ?? args.code);
  if (outcome.kind === 'failed') {
    throw outcome.error;
  }
  if (outcome.kind === 'joined') {
    applyRemoteCredit(credit, outcome.credit);
  } else {
    await joinPodViaRpc(pod.group_code ?? args.code, credit);
  }

  const nextTotal = activeMembers.length + 1;
  if (nextTotal >= target) {
    const finalizedMembers = [...activeMembers, buildMember(userId, credit.id, credit.amount_paid)];
    assertRevenueParity(finalizedMembers, args.listing.price_amount);
  }

  const founder = pod.members.find((m) => (m.intent_size ?? 1) > 0 && m.user_id !== userId);
  if (founder) {
    try {
      await notifyFounderOfJoiner({
        podId: pod.id,
        joinerUserId: userId,
        founderUserId: founder.user_id,
        listing: args.listing,
        source: args.source ?? 'code',
        seatNumber: nextTotal,
        totalSeats: target,
      });
    } catch (error) {
      console.error('[LiquidityService] Failed to notify founder of joiner:', error);
    }
  }

  return { credit, podId: pod.id, synced: true };
}

export type InvitedFriend = { id: string; name: string };

async function createPodInvitations(
  podId: string,
  inviterId: string,
  friends: InvitedFriend[],
  listing?: DbListing,
  inviterName?: string,
  inviterGender?: 'MALE' | 'FEMALE' | null,
): Promise<void> {
  if (friends.length === 0) return;
  try {
    const rows = friends.map((friend) => ({
      pod_id: podId,
      inviter_user_id: inviterId,
      invitee_user_id: friend.id,
      invitee_name: friend.name,
    }));
    const { error } = await supabase.from('pod_invitations').insert(rows);
    if (error) console.error('[LiquidityService] Failed to create pod invitations:', error);
    if (listing) {
      for (const friend of friends) {
        if (!friend.id) continue;
        await sendRoommateInviteDm({
          inviterUserId: inviterId,
          inviteeUserId: friend.id,
          inviterName: inviterName || 'Someone',
          listing,
          inviterGender,
        });
      }
    }
  } catch (error) {
    console.error('[LiquidityService] Exception while creating pod invitations:', error);
  }
}

export async function createFounderCredit(args: { listing: DbListing; estate: Estate; estateId: string; propertyTier: number; targetOccupancy: number; createCode?: string; invitedFriends?: InvitedFriend[]; creatorGender?: 'MALE' | 'FEMALE' | null }): Promise<PurchaseSlotCreditResult> {
  console.log('[PodService] createFounderCredit — listingId:', args.listing.id, 'tier:', args.propertyTier, 'occupancy:', args.targetOccupancy);
  const userId = await currentUserId();
  if (!userId) throw new Error(SIGN_IN_REQUIRED_MESSAGE);

  const code = args.createCode?.trim() || generateInviteCode();
  const credit = buildCredit(userId, args.estateId, args.estate, args.listing.id, args.propertyTier, args.targetOccupancy, code);
  credit.amount_paid = memberAmount(args.listing.price_amount, args.targetOccupancy, 0);
  console.log('[PodService] Credit built — id:', credit.id, 'status:', credit.status, 'amount:', credit.amount_paid);

  const matchedGender = args.creatorGender === 'MALE' || args.creatorGender === 'FEMALE' ? args.creatorGender : 'ANY';

  const pod: Pod = {
    id: `pod-dyn-${Math.floor(100 + Math.random() * 900)}`,
    estate_id: args.estateId,
    listing_id: args.listing.id,
    property_tier: args.propertyTier,
    matched_gender: matchedGender,
    target_occupancy: args.targetOccupancy,
    group_code: code,
    members: [buildMember(userId, credit.id, credit.amount_paid)],
    current_total_intent: 1,
    is_finalized: args.targetOccupancy === 1,
    physical_room_id: args.targetOccupancy === 1 ? `room-${Math.floor(700 + Math.random() * 100)}` : null,
    created_at: new Date().toISOString(),
    verification_status: 'pending_verification',
  };

  if (pod.is_finalized) {
    assertRevenueParity(pod.members, args.listing.price_amount);
  }

  console.log('[PodService] Persisting pod...');
  const realPodId = await persistFounderPod(pod, credit, userId);
  console.log('[PodService] Pod persisted — realPodId:', realPodId);
  if (!realPodId) {
    console.error('[PodService] ABORT — pod persistence returned null');
    throw new Error(SYNC_FAILURE_MESSAGE);
  }
  console.log('[PodService] Creating invitations...');
  await createPodInvitations(realPodId, userId, args.invitedFriends ?? [], args.listing, undefined, args.creatorGender);
  console.log('[PodService] createFounderCredit done — returning credit');
  return { credit, podId: realPodId, synced: true };
}
