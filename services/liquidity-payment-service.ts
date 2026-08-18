import { supabase } from '@/lib/supabase';
import { getLocalCredits, getLocalPods, updateCredit, updatePod } from '@/services/liquidity-store';
import { currentUserId } from '@/services/liquidity-pod-service';
import { unlockLocationForLodge } from '@/services/location-access-service';
import type { SlotCredit, SlotCreditStatus } from '@/types/liquidity';

const DEV_USER_ID = 'usr-current-student';

function setLocalStatus(creditId: string, status: SlotCreditStatus, paidAt?: string): SlotCredit | null {
  const patch: Partial<SlotCredit> = { status };
  if (paidAt) {
    patch.paid_at = paidAt;
  }
  return updateCredit(creditId, patch) ?? null;
}

async function updateRemote(creditId: string, status: SlotCreditStatus, paidAt?: string): Promise<boolean> {
  const payload: { status: SlotCreditStatus; paid_at?: string } = { status };
  if (paidAt) {
    payload.paid_at = paidAt;
  }
  try {
    const { error } = await supabase.from('slot_credits').update(payload).eq('id', creditId);
    if (error) {
      console.warn('[LiquidityPayment] Remote status update skipped:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[LiquidityPayment] Exception during remote status update:', error);
    return false;
  }
}

async function persistStatus(creditId: string, status: SlotCreditStatus, paidAt?: string): Promise<SlotCredit | null> {
  const updated = setLocalStatus(creditId, status, paidAt);
  const userId = await currentUserId();
  if (userId === DEV_USER_ID) {
    return updated;
  }
  await updateRemote(creditId, status, paidAt);
  return updated;
}

export async function markSlotCreditPaid(creditId: string): Promise<SlotCredit | null> {
  const existing = getLocalCredits().find((c) => c.id === creditId);
  if (existing && existing.status === 'paid_unmatched') {
    return existing;
  }
  const updated = await persistStatus(creditId, 'paid_unmatched', new Date().toISOString());
  if (updated?.listing_id) {
    await unlockLocationForLodge({ creditId, listingId: updated.listing_id });
  }
  return updated;
}

function reconcileLocalPod(creditId: string): void {
  const pod = getLocalPods().find((p) => p.members.some((m) => m.slot_credit_id === creditId));
  if (!pod) {
    return;
  }
  const member = pod.members.find((m) => m.slot_credit_id === creditId);
  const nextIntent = Math.max(0, (pod.current_total_intent ?? 0) - (member?.intent_size ?? 1));
  const target = pod.target_occupancy ?? pod.property_tier;
  updatePod(pod.id, { current_total_intent: nextIntent, is_finalized: nextIntent >= target });
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
  const updated = setLocalStatus(creditId, 'expired');
  if (updated) {
    reconcileLocalPod(creditId);
  }
  const userId = await currentUserId();
  if (userId === DEV_USER_ID) {
    return !!updated;
  }
  const remoteOk = await updateRemote(creditId, 'expired');
  await reconcileRemotePod(creditId);
  return !!updated || remoteOk;
}
