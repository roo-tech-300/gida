import type { Env } from './env';
import { attemptStatusByReference, markAttemptByReference } from './payment-attempts';
import { sendPaymentReceipt } from './payment-receipt';
import { refundTransaction } from './paystack-helpers';

export type SlotConfirmResult = {
  confirmed: boolean;
  locationUnlocked: boolean;
  /**
   * Set only when the reservation could not take the payment: true if the money is on its way back to the payer,
   * false if the refund could not be started (needs a human). Absent for a normal confirmation.
   */
  refunded?: boolean;
};

export type SlotConfirmOptions = {
  /** Who paid. Parent payments get a different receipt message. */
  paidBy?: 'parent' | 'student';
  /** Amount Paystack charged, in kobo, for the receipt text. */
  amountKobo?: number;
};

async function insertLocationUnlock(
  baseUrl: string,
  headers: Record<string, string>,
  userId: string,
  listingId: string,
  slotCreditId: string,
): Promise<boolean> {
  const response = await fetch(`${baseUrl}/rest/v1/location_access_payments`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify({
      user_id: userId,
      listing_id: listingId,
      amount_paid: 0,
      method: 'lodge',
      reference: `GIDA-LODGE-${slotCreditId}`,
    }),
  });
  // 409: the unlock already exists (the webhook and the verify call both confirm), which is success.
  if (response.status === 409) return true;
  if (!response.ok) {
    const text = await response.text();
    console.error(`[SlotConfirm] Location unlock insert failed: ${response.status} — ${text}`);
    return false;
  }
  return true;
}

type Decision = 'paid' | 'already_paid' | 'refund';

/** Asks the database what a payment that has arrived means for this reservation. Null when it could not be reached. */
async function decide(baseUrl: string, headers: Record<string, string>, slotCreditId: string): Promise<Decision | null> {
  const response = await fetch(`${baseUrl}/rest/v1/rpc/confirm_slot_payment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ p_credit_id: slotCreditId }),
  });
  if (!response.ok) {
    console.error(`[SlotConfirm] confirm_slot_payment failed for ${slotCreditId}: ${response.status} — ${await response.text()}`);
    return null;
  }
  const value = await response.json();
  return value === 'paid' || value === 'already_paid' || value === 'refund' ? value : null;
}

export async function confirmSlotPayment(
  env: Env,
  slotCreditId: string,
  reference: string,
  options: SlotConfirmOptions = {},
): Promise<SlotConfirmResult> {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const headers = {
    'Content-Type': 'application/json',
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };

  // Who the reservation belongs to: needed for the unlock, the receipt and the refund notice.
  const creditResponse = await fetch(`${baseUrl}/rest/v1/slot_credits?id=eq.${encodeURIComponent(slotCreditId)}&select=user_id,listing_id`, {
    method: 'GET',
    headers,
  });
  if (!creditResponse.ok) {
    console.error(`[SlotConfirm] Failed to read slot credit ${slotCreditId}.`);
    return { confirmed: false, locationUnlocked: false };
  }
  const credit = ((await creditResponse.json()) as { user_id: string; listing_id: string }[])[0];

  // The database decides: pay the reservation, it was already paid (webhook and verify both fire), or refund.
  const decision = await decide(baseUrl, headers, slotCreditId);
  if (decision === null) return { confirmed: false, locationUnlocked: false };

  if (decision === 'refund') {
    // Webhook and verify can both arrive; a payment already handed back must not be refunded twice.
    if ((await attemptStatusByReference(env, slotCreditId, reference)) === 'refunded') {
      return { confirmed: false, locationUnlocked: false, refunded: true };
    }
    const refunded = await refundTransaction(env, reference);
    await markAttemptByReference(env, slotCreditId, reference, refunded ? 'refunded' : 'refund_failed');
    if (refunded && credit) {
      await sendPaymentReceipt(env, {
        studentId: credit.user_id,
        listingId: credit.listing_id,
        amountKobo: options.amountKobo,
        paidBy: options.paidBy ?? 'student',
        outcome: 'refunded',
      });
    }
    return { confirmed: false, locationUnlocked: false, refunded };
  }

  const firstConfirmation = decision === 'paid';
  if (firstConfirmation) await markAttemptByReference(env, slotCreditId, reference, 'paid');

  if (!credit) {
    return { confirmed: true, locationUnlocked: false };
  }

  let locationUnlocked = await insertLocationUnlock(baseUrl, headers, credit.user_id, credit.listing_id, slotCreditId);
  if (!locationUnlocked) {
    console.warn(`[SlotConfirm] Retrying location unlock for credit ${slotCreditId}...`);
    locationUnlocked = await insertLocationUnlock(baseUrl, headers, credit.user_id, credit.listing_id, slotCreditId);
  }

  if (firstConfirmation) {
    await sendPaymentReceipt(env, {
      studentId: credit.user_id,
      listingId: credit.listing_id,
      amountKobo: options.amountKobo,
      paidBy: options.paidBy ?? 'student',
    });
  }

  return { confirmed: true, locationUnlocked };
}
