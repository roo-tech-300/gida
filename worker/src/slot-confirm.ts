import type { Env } from './env';
import { sendPaymentReceipt } from './payment-receipt';

export type SlotConfirmResult = {
  confirmed: boolean;
  locationUnlocked: boolean;
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

export async function confirmSlotPayment(
  env: Env,
  slotCreditId: string,
  _reference: string,
  options: SlotConfirmOptions = {},
): Promise<SlotConfirmResult> {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const headers = {
    'Content-Type': 'application/json',
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };

  // Only an unpaid reservation moves to paid. A second confirmation (webhook + verify both fire) matches
  // nothing, so it neither resets paid_at, nor reverts a matched credit, nor sends a second receipt.
  const now = new Date().toISOString();
  const updateResponse = await fetch(
    `${baseUrl}/rest/v1/slot_credits?id=eq.${encodeURIComponent(slotCreditId)}&status=in.(booked,booked_pending_claim,expired)`,
    {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ status: 'paid_unmatched', paid_at: now }),
    },
  );
  if (!updateResponse.ok) {
    const text = await updateResponse.text();
    console.error(`[SlotConfirm] Failed to update slot credit ${slotCreditId}: ${updateResponse.status} — ${text}`);
    return { confirmed: false, locationUnlocked: false };
  }
  const changed = (await updateResponse.json().catch(() => [])) as { user_id?: string; listing_id?: string }[];
  const firstConfirmation = changed.length > 0;

  const creditResponse = await fetch(`${baseUrl}/rest/v1/slot_credits?id=eq.${encodeURIComponent(slotCreditId)}&select=user_id,listing_id`, {
    method: 'GET',
    headers,
  });
  if (!creditResponse.ok) {
    console.error(`[SlotConfirm] Failed to read slot credit ${slotCreditId} for location unlock.`);
    return { confirmed: true, locationUnlocked: false };
  }
  const rows = (await creditResponse.json()) as { user_id: string; listing_id: string }[];
  const credit = rows[0];
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
