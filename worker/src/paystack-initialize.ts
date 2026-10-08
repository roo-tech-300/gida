import { z } from 'zod';

import type { Env } from './env';
import { claimPaymentAttempt, updatePaymentAttempt } from './payment-attempts';
import { json } from './paystack-helpers';
import { authenticatedUserId, jsonError, requireUuid, type PaymentMetadata } from './paystack-types';

const PAYSTACK_BASE = 'https://api.paystack.co';

export async function handleInitialize(request: Request, env: Env): Promise<Response> {
  const parseResult = z.object({
    listingId: z.string(),
    email: z.string().email(),
    callbackUrl: z.string().url(),
    userId: z.string(),
    kind: z.enum(['location', 'tour', 'lodge']).default('location'),
    tourBookingId: z.string().optional(),
    slotCreditId: z.string().optional(),
  }).safeParse(await request.json().catch(() => null));
  if (!parseResult.success) return jsonError('Invalid payload.', 400);

  const { listingId, email, callbackUrl, userId, kind, tourBookingId, slotCreditId } = parseResult.data;
  const authenticatedId = await authenticatedUserId(request, env);
  if (!authenticatedId || authenticatedId !== userId) return jsonError('Sign in to continue.', 401);
  if (!requireUuid(listingId)) return jsonError('Invalid listing id.', 400);
  if (kind === 'tour' && !requireUuid(tourBookingId)) return jsonError('Missing tour booking.', 400);
  if (kind === 'lodge' && !requireUuid(slotCreditId)) return jsonError('Missing slot credit id.', 400);

  const purchaseId = kind === 'lodge' ? slotCreditId! : kind === 'tour' ? tourBookingId! : listingId;
  const claim = await claimPaymentAttempt(env, { kind, purchaseId, userId, listingId });
  if (claim.decision === 'already_paid') {
    return jsonError(kind === 'tour' ? 'This tour has already been paid for.' :
      kind === 'lodge' ? 'This reservation has already been paid for.' :
        'Location access is already unlocked for this property.', 409);
  }
  if (claim.decision === 'not_found') return jsonError('This purchase was not found for your account.', 404);
  if (claim.decision === 'not_payable') return jsonError('This purchase is not available for payment.', 409);
  if (claim.decision === 'invalid_purchase') return jsonError('Invalid payment request.', 400);
  if (claim.decision === 'initializing') return jsonError('Payment is being prepared. Please try again in a moment.', 409);
  if (claim.decision === 'reuse') {
    if (!claim.authorization_url || !claim.reference) return jsonError('Existing payment session is unavailable.', 409);
    return json({ authorizationUrl: claim.authorization_url, reference: claim.reference });
  }
  if (!claim.attempt_id || !claim.reference || !claim.amount_ngn) {
    return jsonError('Payment service returned an invalid attempt.', 500);
  }

  const metadata: PaymentMetadata = {
    kind,
    userId,
    listingId,
    paymentAttemptId: claim.attempt_id,
    ...(kind === 'tour' ? { tourBookingId } : {}),
    ...(kind === 'lodge' ? { slotCreditId } : {}),
  };
  const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      amount: Math.round(claim.amount_ngn * 100),
      reference: claim.reference,
      callback_url: callbackUrl,
      metadata,
    }),
  });
  const result = (await response.json()) as {
    status: boolean;
    message?: string;
    data?: { authorization_url: string; reference: string };
  };
  if (!response.ok || !result.status || !result.data?.authorization_url) {
    await updatePaymentAttempt(env, claim.attempt_id, 'failed');
    return jsonError(result.message ?? 'Failed to initialize payment.', 502);
  }

  const saved = await updatePaymentAttempt(env, claim.attempt_id, 'pending', result.data.authorization_url);
  if (!saved) return jsonError('Could not save the payment session. Please retry shortly.', 503);
  return json({ authorizationUrl: result.data.authorization_url, reference: result.data.reference });
}
