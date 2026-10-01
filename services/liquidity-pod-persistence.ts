import { supabase } from '@/lib/supabase';
import { ALREADY_RESERVED_MESSAGE, isAlreadyReservedError } from '@/services/booking-guard-service';
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
      // The DB trigger / unique index reject a second active booking — surface
      // that as the friendly message instead of the generic persist failure.
      if (error && isAlreadyReservedError(error.message, error.code)) {
        throw new Error(ALREADY_RESERVED_MESSAGE);
      }
      return undefined;
    }
    console.log('[Persistence] Slot credit inserted — id:', data.id);
    return data.id;
  } catch (error) {
    if (error instanceof Error && error.message === ALREADY_RESERVED_MESSAGE) {
      throw error;
    }
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
        verification_status: pod.verification_status,
      })
      .select()
      .maybeSingle();
    if (error || !data) {
      console.error('[Persistence] Pod insert FAILED:', error?.message ?? 'no data', error?.code);
      return null;
    }
    console.log('[Persistence] Pod inserted — id:', data.id);
    let persisted: boolean;
    try {
      persisted = await persistFounderCredit(credit, data.id, userId);
    } catch (creditError) {
      // Active-booking rejection: remove the pod we just created so no orphan
      // row is left behind, then surface the friendly message to the UI.
      if (creditError instanceof Error && creditError.message === ALREADY_RESERVED_MESSAGE) {
        console.warn('[Persistence] Booking rejected by backend — rolling back orphan pod:', data.id);
        try {
          const { error: rollbackError } = await supabase.from('pods').delete().eq('id', data.id);
          if (rollbackError) {
            console.error('[Persistence] Orphan pod rollback failed:', rollbackError.message);
          }
        } catch (rollbackError) {
          console.error('[Persistence] Orphan pod rollback failed:', rollbackError);
        }
      }
      throw creditError;
    }
    console.log('[Persistence] Founder credit persisted:', persisted);
    if (!persisted) return null;
    pod.id = data.id;
    return data.id;
  } catch (error) {
    if (error instanceof Error && error.message === ALREADY_RESERVED_MESSAGE) {
      throw error;
    }
    console.error('[Persistence] Exception during pod persistence:', error);
    return null;
  }
}
