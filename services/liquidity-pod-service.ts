import { supabase } from '@/lib/supabase';
import { addCredit, addPod, upsertPod, getLocalPods, updateCredit, removeLocalCredit, removeLocalPod } from '@/services/liquidity-store';
import { EXPECTED_TOTAL_POD_FEE, PAYMENT_WINDOW_MS } from '@/utils/liquidity-math';
import { memberAmount, assertRevenueParity } from '@/utils/liquidity-pricing';
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

function buildMember(userId: string, creditId: string, amountPaid?: number): PodMember {
  return {
    user_id: userId,
    full_name: 'You (Current User)',
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

async function insertCredit(credit: SlotCredit, userId: string): Promise<string | undefined> {
  try {
    const { data, error } = await supabase
      .from('slot_credits')
      .insert({
        user_id: userId,
        estate_id: credit.estate_id,
        listing_id: credit.listing_id,
        property_tier: credit.property_tier,
        intent_size: credit.intent_size,
        target_occupancy: credit.target_occupancy,
        status: credit.status,
        invite_code: credit.invite_code,
        payment_deadline: credit.payment_deadline,
        amount_paid: credit.amount_paid ?? null,
      })
      .select()
      .maybeSingle();
    if (error || !data) {
      console.warn('[LiquidityService] Slot credit insert skipped:', error?.message ?? 'no data');
      return undefined;
    }
    return data.id;
  } catch (error) {
    console.error('[LiquidityService] Exception during slot credit insert:', error);
    return undefined;
  }
}

async function persistFounderCredit(credit: SlotCredit, podId: string, userId: string): Promise<boolean> {
  const creditId = await insertCredit(credit, userId);
  if (!creditId) return false;
  const { error: memberError } = await supabase.from('pod_members').insert({
    pod_id: podId,
    user_id: userId,
    slot_credit_id: creditId,
    intent_size: credit.intent_size,
    amount_paid: credit.amount_paid ?? null,
  });
  if (memberError) {
    console.warn('[LiquidityService] Founder pod_members insert skipped:', memberError.message);
    return false;
  }
  if (creditId !== credit.id) {
    updateCredit(credit.id, { id: creditId });
    credit.id = creditId;
  }
  return true;
}

async function persistFounderPod(pod: Pod, credit: SlotCredit, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('pods')
      .insert({
        estate_id: pod.estate_id,
        listing_id: pod.listing_id,
        property_tier: pod.property_tier,
        matched_gender: pod.matched_gender,
        target_occupancy: pod.target_occupancy,
        group_code: pod.group_code,
        current_total_intent: pod.current_total_intent,
        is_finalized: pod.is_finalized,
      })
      .select()
      .maybeSingle();
    if (error || !data) {
      console.warn('[LiquidityService] Pod insert skipped:', error?.message ?? 'no data');
      return false;
    }
    return persistFounderCredit(credit, data.id, userId);
  } catch (error) {
    console.error('[LiquidityService] Exception during pod persistence:', error);
    return false;
  }
}

async function persistJoin(updatedPod: Pod, credit: SlotCredit, userId: string): Promise<boolean> {
  try {
    const creditId = await insertCredit(credit, userId);
    if (!creditId) return false;
    const { error: memberError } = await supabase.from('pod_members').insert({
      pod_id: updatedPod.id,
      user_id: userId,
      slot_credit_id: creditId,
      intent_size: credit.intent_size,
      amount_paid: credit.amount_paid ?? null,
    });
    if (memberError) {
      console.warn('[LiquidityService] Join pod_members insert skipped:', memberError.message);
      return false;
    }
    const { error: podUpdateError } = await supabase
      .from('pods')
      .update({
        current_total_intent: updatedPod.current_total_intent,
        is_finalized: updatedPod.is_finalized,
        physical_room_id: updatedPod.physical_room_id ?? null,
      })
      .eq('id', updatedPod.id);
    if (podUpdateError) {
      console.warn('[LiquidityService] Pod occupancy update skipped:', podUpdateError.message);
      return false;
    }
    if (creditId !== credit.id) {
      updateCredit(credit.id, { id: creditId });
      credit.id = creditId;
    }
    return true;
  } catch (error) {
    console.error('[LiquidityService] Exception during join persistence:', error);
    return false;
  }
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
