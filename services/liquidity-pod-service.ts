import { supabase } from '@/lib/supabase';
import { EXPECTED_TOTAL_POD_FEE, PAYMENT_WINDOW_MS } from '@/utils/liquidity-math';
import { memberAmount, assertRevenueParity } from '@/utils/liquidity-pricing';
import { persistFounderPod, persistJoin } from '@/services/liquidity-pod-persistence';
import type { Estate, SlotCredit, Pod, PodMember } from '@/types/liquidity';
import type { DbListing } from '@/types/feed-listing';

export const SIGN_IN_REQUIRED_MESSAGE = 'Please sign in to continue.';

const SYNC_FAILURE_MESSAGE = 'Could not persist your reservation to the server. Please try again.';

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

  const pod = await getPodById(podId);
  const founder = pod.members[0];
  if (founder?.user_id !== userId) {
    throw new Error('Only the group founder can remove members.');
  }

  const target = pod.members.find((m) => m.user_id === targetUserId);
  if (!target) throw new Error('Member not found in this group.');
  if (target.user_id === userId) throw new Error('You cannot remove yourself from the group.');
  if (target.amount_paid) throw new Error('Paid members cannot be removed.');

  const nextMembers = pod.members.filter((m) => m.user_id !== targetUserId);
  const removedIntent = target.intent_size ?? 1;
  const nextIntent = Math.max(0, (pod.current_total_intent ?? 0) - removedIntent);
  const targetOccupancy = pod.target_occupancy ?? pod.property_tier;

  const updatedPod: Pod = {
    ...pod,
    members: nextMembers,
    current_total_intent: nextIntent,
    is_finalized: nextIntent >= targetOccupancy,
    physical_room_id: nextIntent >= targetOccupancy
      ? pod.physical_room_id ?? `room-${Math.floor(700 + Math.random() * 100)}`
      : null,
  };

  try {
    await supabase.from('pod_members').delete().eq('pod_id', podId).eq('user_id', targetUserId);
    await supabase.from('pods').update({
      current_total_intent: nextIntent,
      is_finalized: updatedPod.is_finalized,
      physical_room_id: updatedPod.physical_room_id ?? null,
    }).eq('id', podId);
    if (target.slot_credit_id && target.slot_credit_id !== 'invitation') {
      await supabase.from('slot_credits').update({ status: 'expired' }).eq('id', target.slot_credit_id);
    }
  } catch (error) {
    console.error('[LiquidityService] Failed to persist member removal:', error);
    throw new Error('Could not remove the member on the server. Try again.');
  }

  return updatedPod;
}

export type PurchaseSlotCreditResult = { credit: SlotCredit; synced: boolean };

export async function joinPodByCode(args: { code: string; listing: DbListing; estate: Estate; estateId: string; propertyTier: number }): Promise<PurchaseSlotCreditResult> {
  const pod = await findPodByGroupCode(args.code);
  if (!pod) {
    throw new Error('Invite code not found. Ask your friend to share their invite code.');
  }

  const target = pod.target_occupancy ?? args.propertyTier;
  if (pod.current_total_intent + 1 > target) {
    throw new Error('This group is already full. Pick another invite code or a lower occupancy.');
  }

  const userId = await currentUserId();
  if (!userId) throw new Error(SIGN_IN_REQUIRED_MESSAGE);

  const credit = buildCredit(userId, args.estateId, args.estate, args.listing.id, pod.property_tier, target, generateInviteCode());
  credit.amount_paid = memberAmount(args.listing.price_amount, EXPECTED_TOTAL_POD_FEE, target, pod.current_total_intent);

  const member = buildMember(userId, credit.id, credit.amount_paid);
  const nextTotal = pod.current_total_intent + 1;
  const updatedPod: Pod = {
    ...pod,
    members: [...pod.members, member],
    current_total_intent: nextTotal,
    is_finalized: nextTotal >= target,
    physical_room_id: nextTotal >= target ? pod.physical_room_id ?? `room-${Math.floor(700 + Math.random() * 100)}` : pod.physical_room_id,
  };

  if (updatedPod.is_finalized) {
    assertRevenueParity(updatedPod.members, args.listing.price_amount, EXPECTED_TOTAL_POD_FEE);
  }

  const synced = await persistJoin(updatedPod, credit, userId);
  if (!synced) {
    throw new Error(SYNC_FAILURE_MESSAGE);
  }
  return { credit, synced: true };
}

export type InvitedFriend = { id: string; name: string };

async function createPodInvitations(podId: string, inviterId: string, friends: InvitedFriend[]): Promise<void> {
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
  } catch (error) {
    console.error('[LiquidityService] Exception while creating pod invitations:', error);
  }
}

export async function createFounderCredit(args: { listing: DbListing; estate: Estate; estateId: string; propertyTier: number; targetOccupancy: number; createCode?: string; invitedFriends?: InvitedFriend[] }): Promise<PurchaseSlotCreditResult> {
  const userId = await currentUserId();
  if (!userId) throw new Error(SIGN_IN_REQUIRED_MESSAGE);

  const code = args.createCode?.trim() || generateInviteCode();
  const credit = buildCredit(userId, args.estateId, args.estate, args.listing.id, args.propertyTier, args.targetOccupancy, code);
  credit.amount_paid = memberAmount(args.listing.price_amount, EXPECTED_TOTAL_POD_FEE, args.targetOccupancy, 0);

  const pod: Pod = {
    id: `pod-dyn-${Math.floor(100 + Math.random() * 900)}`,
    estate_id: args.estateId,
    listing_id: args.listing.id,
    property_tier: args.propertyTier,
    matched_gender: 'ANY',
    target_occupancy: args.targetOccupancy,
    group_code: code,
    members: [buildMember(userId, credit.id, credit.amount_paid)],
    current_total_intent: 1,
    is_finalized: args.targetOccupancy === 1,
    physical_room_id: args.targetOccupancy === 1 ? `room-${Math.floor(700 + Math.random() * 100)}` : null,
    created_at: new Date().toISOString(),
  };

  if (pod.is_finalized) {
    assertRevenueParity(pod.members, args.listing.price_amount, EXPECTED_TOTAL_POD_FEE);
  }

  const realPodId = await persistFounderPod(pod, credit, userId);
  if (!realPodId) {
    throw new Error(SYNC_FAILURE_MESSAGE);
  }
  await createPodInvitations(pod.id, userId, args.invitedFriends ?? []);
  return { credit, synced: true };
}
