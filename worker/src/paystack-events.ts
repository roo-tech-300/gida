import type { Env } from './env';
import { updatePaymentAttempt } from './payment-attempts';
import { confirmSlotPayment } from './slot-confirm';
import { confirmTourBooking } from './tour-confirm';
import { json, paystackHeaders, upsertPayment, type PaymentRow } from './paystack-helpers';
import { authenticatedUserId, jsonError, requireUuid, type PaymentMetadata } from './paystack-types';

const PAYSTACK_BASE = 'https://api.paystack.co';
const LOCATION_ACCESS_FEE_NGN = 500;
const ASSISTED_TOUR_FEE_NGN = 2000;

async function hmacSha512Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function paymentRow(kind: string | undefined, meta: PaymentMetadata, reference: string, chargedAmount?: number, channel?: string): PaymentRow | null {
  const userId = requireUuid(meta.userId);
  const listingId = requireUuid(meta.listingId);
  if (!userId || !listingId) return null;
  const defaultAmount = kind === 'tour' ? ASSISTED_TOUR_FEE_NGN : LOCATION_ACCESS_FEE_NGN;
  return {
    user_id: userId,
    listing_id: listingId,
    amount_paid: (chargedAmount ?? defaultAmount * 100) / 100,
    method: kind === 'tour' ? 'tour' : kind === 'lodge' ? 'lodge' : channel ?? 'card',
    reference,
    status: 'paid',
  };
}

type PaystackResult = {
  status: boolean;
  data?: { status: string; reference: string; amount?: number; channel?: string; metadata?: PaymentMetadata };
};

async function persistSuccess(env: Env, data: NonNullable<PaystackResult['data']>): Promise<boolean> {
  const metadata = data.metadata ?? {};
  const kind = metadata.kind === 'tour' ? 'tour' : metadata.kind === 'lodge' ? 'lodge' : 'location';
  if (kind === 'lodge' && metadata.slotCreditId) {
    const result = await confirmSlotPayment(env, metadata.slotCreditId, data.reference);
    if (!result.confirmed) return false;
  } else {
    const row = paymentRow(kind, metadata, data.reference, data.amount, data.channel);
    if (!row || !(await upsertPayment(env, row))) return false;
    if (kind === 'tour' && metadata.tourBookingId && !(await confirmTourBooking(env, metadata.tourBookingId))) return false;
  }
  if (metadata.paymentAttemptId) {
    return updatePaymentAttempt(env, metadata.paymentAttemptId, 'paid');
  }
  return true;
}

export async function handleVerify(request: Request, env: Env): Promise<Response> {
  const userId = await authenticatedUserId(request, env);
  if (!userId) return jsonError('Sign in to verify this payment.', 401);
  const body = (await request.json().catch(() => null)) as { reference?: unknown } | null;
  if (!body || typeof body.reference !== 'string' || !body.reference.trim()) return jsonError('Invalid payload.', 400);

  const response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(body.reference)}`, {
    method: 'GET', headers: paystackHeaders(env),
  });
  const result = (await response.json()) as PaystackResult;
  if (!response.ok || !result.status || !result.data || result.data.status !== 'success') {
    if (result.data?.metadata?.userId === userId && result.data.metadata.paymentAttemptId && ['failed', 'abandoned'].includes(result.data.status)) {
      await updatePaymentAttempt(env, result.data.metadata.paymentAttemptId, 'failed');
    }
    return json({ unlocked: false, status: result.data?.status ?? 'failed' }, 200);
  }
  if (result.data.metadata?.userId !== userId) return jsonError('This payment does not belong to your account.', 403);
  const saved = await persistSuccess(env, result.data);
  if (!saved) return json({ unlocked: false, status: 'persist-failed' }, 500);
  const metadata = result.data.metadata;
  const kind = metadata?.kind === 'tour' ? 'tour' : metadata?.kind === 'lodge' ? 'lodge' : 'location';
  if (kind === 'lodge') return json({ unlocked: true, kind, slotCreditId: metadata?.slotCreditId }, 200);
  if (kind === 'tour') return json({ unlocked: true, kind, bookingId: metadata?.tourBookingId }, 200);
  return json({ unlocked: true, kind, listingId: metadata?.listingId }, 200);
}

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');
  if (!signature || await hmacSha512Hex(env.PAYSTACK_SECRET_KEY, rawBody) !== signature) {
    return jsonError('Invalid signature.', 401);
  }
  const payload = JSON.parse(rawBody) as { event?: string; data?: PaystackResult['data'] };
  if (payload.event !== 'charge.success' || payload.data?.status !== 'success') return json({ received: true });
  if (!payload.data.reference) return json({ received: true });
  const saved = await persistSuccess(env, payload.data);
  if (!saved) return json({ error: 'Payment confirmation failed.' }, 500);
  return json({ received: true });
}
