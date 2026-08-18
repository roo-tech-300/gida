import { supabase } from '@/lib/supabase';
import { updateCredit } from '@/services/liquidity-store';
import { assertRevenueParity } from '@/utils/liquidity-pricing';
import type { SlotCredit, Pod } from '@/types/liquidity';

export async function insertCredit(credit: SlotCredit, userId: string): Promise<string | undefined> {
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
    updateCredit(credit.id, { id: creditId });
    credit.id = creditId;
  }
  return true;
}

export async function persistFounderPod(pod: Pod, credit: SlotCredit, userId: string): Promise<boolean> {
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

export async function persistJoin(updatedPod: Pod, credit: SlotCredit, userId: string): Promise<boolean> {
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
