import type { Env } from './env';

export type SlotConfirmResult = {
  confirmed: boolean;
  locationUnlocked: boolean;
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
  if (!response.ok) {
    const text = await response.text();
    console.error(`[SlotConfirm] Location unlock insert failed: ${response.status} — ${text}`);
    return false;
  }
  return true;
}

export async function confirmSlotPayment(env: Env, slotCreditId: string, reference: string): Promise<SlotConfirmResult> {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const headers = {
    'Content-Type': 'application/json',
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };

  const now = new Date().toISOString();
  const updateResponse = await fetch(`${baseUrl}/rest/v1/slot_credits?id=eq.${encodeURIComponent(slotCreditId)}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'paid_unmatched', paid_at: now }),
  });
  if (!updateResponse.ok) {
    const text = await updateResponse.text();
    console.error(`[SlotConfirm] Failed to update slot credit ${slotCreditId}: ${updateResponse.status} — ${text}`);
    return { confirmed: false, locationUnlocked: false };
  }

  const creditResponse = await fetch(`${baseUrl}/rest/v1/slot_credits?id=eq.${encodeURIComponent(slotCreditId)}&select=user_id,listing_id`, {
    method: 'GET',
    headers,
  });
  if (!creditResponse.ok) {
    console.error(`[SlotConfirm] Failed to read slot credit ${slotCreditId} for location unlock.`);
    return { confirmed: true, locationUnlocked: false };
  }
  const rows = (await creditResponse.json()) as Array<{ user_id: string; listing_id: string }>;
  const credit = rows[0];
  if (!credit) {
    return { confirmed: true, locationUnlocked: false };
  }

  let locationUnlocked = await insertLocationUnlock(baseUrl, headers, credit.user_id, credit.listing_id, slotCreditId);
  if (!locationUnlocked) {
    console.warn(`[SlotConfirm] Retrying location unlock for credit ${slotCreditId}...`);
    locationUnlocked = await insertLocationUnlock(baseUrl, headers, credit.user_id, credit.listing_id, slotCreditId);
  }

  return { confirmed: true, locationUnlocked };
}
