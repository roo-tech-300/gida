import { supabase } from '@/lib/supabase';
import { addCredit, addPod, upsertPod, getLocalPods, removeLocalCredit, removeLocalPod } from '@/services/liquidity-store';
import { EXPECTED_TOTAL_POD_FEE, PAYMENT_WINDOW_MS } from '@/utils/liquidity-math';
import { memberAmount, assertRevenueParity } from '@/utils/liquidity-pricing';
import { insertCredit, persistFounderPod, persistJoin } from '@/services/liquidity-pod-persistence';
import type { Estate, SlotCredit, Pod, PodMember } from '@/types/liquidity';
import type { DbListing } from '@/types/feed-listing';

export const DEV_USER_ID = 'usr-current-student';

const SYNC_FAILURE_MESSAGE = 'Could not persist your reservation to the server. Please sign in and try again.';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 12;

export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `GIDA-POD-${code}`;
}

export async function currentUserId(): Promise<string> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? DEV_USER_ID;
  } catch (error) {
    console.error('[LiquidityService] Failed to resolve current user:', error);
    return DEV_USER_ID;
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

function buildCredit(estateId: string, estate: Estate, listingId: string, propertyTier: number, targetOccupancy: number, code: string): SlotCredit {
  return {
    id: `credit-dyn-${Date.now()}`,
    user_id: 'usr-current-student',
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
  const local = getLocalPods().find((pod) => (pod.group_code ?? '').toUpperCase() === normalized);
  if (local) return local;

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

export async function removeMemberFromPod(podId: string, targetUserId: string): Promise<Pod> {
  const userId = await currentUserId();
  const pod = getLocalPods().find((p) => p.id === podId);
  if (!pod) throw new Error('Pod not found.');

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
  upsertPod(updatedPod);

  if (userId !== DEV_USER_ID) {
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
    }
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
  const credit = buildCredit(args.estateId, args.estate, args.listing.id, pod.property_tier, target, generateInviteCode());
  credit.user_id = userId;
  credit.amount_paid = memberAmount(args.listing.price_amount, EXPECTED_TOTAL_POD_FEE, target, pod.current_total_intent);
  addCredit(credit);

  const member = buildMember(userId, credit.id, credit.amount_paid);
  const nextTotal = pod.current_total_intent + 1;
  const podWasLocal = getLocalPods().some((p) => p.id === pod.id);
  const updatedPod: Pod = {
    ...pod,
    members: [...pod.members, member],
    current_total_intent: nextTotal,
    is_finalized: nextTotal >= target,
    physical_room_id: nextTotal >= target ? pod.physical_room_id ?? `room-${Math.floor(700 + Math.random() * 100)}` : pod.physical_room_id,
  };
  upsertPod(updatedPod);

  if (updatedPod.is_finalized) {
    assertRevenueParity(updatedPod.members, args.listing.price_amount, EXPECTED_TOTAL_POD_FEE);
  }

  const synced = await persistJoin(updatedPod, credit, userId);
  if (!synced && userId !== DEV_USER_ID) {
    removeLocalCredit(credit.id);
    if (podWasLocal) {
      upsertPod(pod);
    } else {
      removeLocalPod(updatedPod.id);
    }
    throw new Error(SYNC_FAILURE_MESSAGE);
  }
  return { credit, synced };
}

export async function createFounderCredit(args: { listing: DbListing; estate: Estate; estateId: string; propertyTier: number; targetOccupancy: number; createCode?: string }): Promise<PurchaseSlotCreditResult> {
  const code = args.createCode?.trim() || generateInviteCode();
  const userId = await currentUserId();
  const credit = buildCredit(args.estateId, args.estate, args.listing.id, args.propertyTier, args.targetOccupancy, code);
  credit.user_id = userId;
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

  addCredit(credit);
  addPod(pod);

  const synced = await persistFounderPod(pod, credit, userId);
  if (!synced && userId !== DEV_USER_ID) {
    removeLocalCredit(credit.id);
    removeLocalPod(pod.id);
    throw new Error(SYNC_FAILURE_MESSAGE);
  }
  return { credit, synced };
}
