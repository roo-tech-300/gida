import { supabase } from '@/lib/supabase';
import type { SlotCredit, Pod } from '@/types/liquidity';

export async function insertCredit(credit: SlotCredit, userId: string): Promise<string | undefined> {
  console.log('[Persistence] insertCredit — userId:', userId, 'status:', credit.status, 'listingId:', credit.listing_id);
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
      console.error('[Persistence] Slot credit insert FAILED:', error?.message ?? 'no data', error?.code);
      return undefined;
    }
    console.log('[Persistence] Slot credit inserted — id:', data.id);
    return data.id;
  } catch (error) {
    console.error('[Persistence] Exception during slot credit insert:', error);
    return undefined;
  }
}

export async function persistFounderCredit(credit: SlotCredit, podId: string, userId: string): Promise<boolean> {
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
    credit.id = creditId;
  }
  return true;
}

export async function persistFounderPod(pod: Pod, credit: SlotCredit, userId: string): Promise<string | null> {
  console.log('[Persistence] persistFounderPod — estateId:', pod.estate_id, 'listingId:', pod.listing_id);
  try {
    console.log('[Persistence] Inserting pod...');
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
      console.error('[Persistence] Pod insert FAILED:', error?.message ?? 'no data', error?.code);
      return null;
    }
    console.log('[Persistence] Pod inserted — id:', data.id);
    const persisted = await persistFounderCredit(credit, data.id, userId);
    console.log('[Persistence] Founder credit persisted:', persisted);
    if (!persisted) return null;
    pod.id = data.id;
    return data.id;
  } catch (error) {
    console.error('[Persistence] Exception during pod persistence:', error);
    return null;
  }
}
