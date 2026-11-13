import { type PaymentRow } from './paystack-helpers';

export const LOCATION_ACCESS_FEE_NGN = 500;
export const ASSISTED_TOUR_FEE_NGN = 2000;

export async function hmacSha512Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export type PaymentMetadata = {
  kind?: string;
  userId?: string;
  listingId?: string;
  tourBookingId?: string;
  slotCreditId?: string;
  paidBy?: string;
};

export function requireUuid(value: string | undefined): string | null {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return value && uuidPattern.test(value) ? value : null;
}

export function paymentAmountKobo(kind: string | undefined, chargedAmount?: number): number {
  if (kind === 'tour') {
    return chargedAmount ?? ASSISTED_TOUR_FEE_NGN * 100;
  }
  return chargedAmount ?? LOCATION_ACCESS_FEE_NGN * 100;
}

export function paymentMethod(kind: string | undefined, channel?: string): string {
  if (kind === 'tour') return 'tour';
  if (kind === 'lodge') return 'lodge';
  return channel ?? 'card';
}

export function paymentRow(kind: string | undefined, meta: PaymentMetadata, reference: string, chargedAmount?: number, channel?: string): PaymentRow | null {
  const userId = requireUuid(meta.userId);
  const listingId = requireUuid(meta.listingId);
  if (!userId || !listingId) {
    return null;
  }
  return {
    user_id: userId,
    listing_id: listingId,
    amount_paid: paymentAmountKobo(kind, chargedAmount) / 100,
    method: paymentMethod(kind, channel),
    reference,
    status: 'paid',
  };
}
