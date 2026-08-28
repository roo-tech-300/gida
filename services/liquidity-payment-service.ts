import { supabase } from '@/lib/supabase';
import { currentUserId, SIGN_IN_REQUIRED_MESSAGE } from '@/services/liquidity-pod-service';
import { unlockLocationForLodge } from '@/services/location-access-service';
import type { SlotCredit, SlotCreditStatus } from '@/types/liquidity';

async function updateRemote(creditId: string, status: SlotCreditStatus, paidAt?: string): Promise<SlotCredit | null> {
  const payload: { status: SlotCreditStatus; paid_at?: string } = { status };
  if (paidAt) {
    payload.paid_at = paidAt;
  }
  try {
    const { data, error } = await supabase.from('slot_credits').update(payload).eq('id', creditId).select().maybeSingle();
    if (error) {
      console.warn('[LiquidityPayment] Remote status update skipped:', error.message);
      return null;
    }
    return (data as SlotCredit) ?? null;
  } catch (error) {
    console.error('[LiquidityPayment] Exception during remote status update:', error);
    return null;
  }
}

export async function markSlotCreditPaid(creditId: string): Promise<SlotCredit | null> {
  const userId = await currentUserId();
  if (!userId) throw new Error(SIGN_IN_REQUIRED_MESSAGE);

  const updated = await updateRemote(creditId, 'paid_unmatched', new Date().toISOString());
  if (!updated) return null;
  if (updated.listing_id) {
    await unlockLocationForLodge({ creditId, listingId: updated.listing_id });
  }
  return updated;
}

async function reconcileRemotePod(creditId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('reconcile_pod_after_credit_expiry', { p_slot_credit_id: creditId });
    if (error) {
      console.warn('[LiquidityPayment] Pod reconciliation skipped:', error.message);
    }
  } catch (error) {
    console.error('[LiquidityPayment] Exception during pod reconciliation:', error);
  }
}

export async function expireSlotCredit(creditId: string): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) throw new Error(SIGN_IN_REQUIRED_MESSAGE);

  const remoteOk = await updateRemote(creditId, 'expired');
  await reconcileRemotePod(creditId);
  return remoteOk !== null;
}
