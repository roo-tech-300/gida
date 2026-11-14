import type { Env } from './env';
import { claimPaymentAttempt, updatePaymentAttempt } from './payment-attempts';
import { createPaystackTransaction } from './paystack-helpers';

export type StartLodgePaymentInput = {
  creditId: string;
  userId: string;
  listingId: string;
  email: string;
  callbackUrl: string;
  paidBy: 'student' | 'parent';
};

export type StartLodgePaymentResult =
  | { ok: true; authorizationUrl: string; reference: string }
  | { ok: false; status: number; error: string };

/**
 * Starts a payment for a reservation, for the student's own checkout and for a parent's pay link alike.
 * The database decides whether the reservation can be paid at all (a cancelled, expired or not-yet-approved one
 * cannot) and keeps one live checkout per reservation, so a payment is never started that has nowhere to land.
 */
export async function startLodgePayment(env: Env, input: StartLodgePaymentInput): Promise<StartLodgePaymentResult> {
  const claim = await claimPaymentAttempt(env, { kind: 'lodge', purchaseId: input.creditId, userId: input.userId, listingId: input.listingId });

  switch (claim.decision) {
    case 'already_paid':
      return { ok: false, status: 409, error: 'This reservation has already been paid for.' };
    case 'not_found':
      return { ok: false, status: 404, error: 'We could not find that reservation.' };
    case 'invalid_purchase':
      return { ok: false, status: 400, error: 'That reservation cannot be paid.' };
    case 'not_payable':
      return { ok: false, status: 409, error: 'This reservation can no longer be paid. It may have been cancelled, may have run out, or is not approved yet.' };
    case 'initializing':
      return { ok: false, status: 409, error: 'A payment for this reservation is already starting. Please try again in a moment.' };
    case 'reuse':
      if (claim.authorization_url && claim.reference) return { ok: true, authorizationUrl: claim.authorization_url, reference: claim.reference };
      return { ok: false, status: 409, error: 'A payment for this reservation is already starting. Please try again in a moment.' };
    case 'new':
      break;
  }

  if (!claim.attempt_id || !claim.reference || !claim.amount_ngn || claim.amount_ngn <= 0) {
    return { ok: false, status: 400, error: 'This reservation has no amount to pay.' };
  }

  const created = await createPaystackTransaction(env, {
    email: input.email,
    amountKobo: Math.round(claim.amount_ngn * 100),
    reference: claim.reference,
    callbackUrl: input.callbackUrl,
    // Same shape for both payers, so the one webhook confirms either.
    metadata: {
      kind: 'lodge',
      userId: input.userId,
      listingId: input.listingId,
      slotCreditId: input.creditId,
      ...(input.paidBy === 'parent' ? { paidBy: 'parent' } : {}),
    },
  });
  if (!created.ok) {
    await updatePaymentAttempt(env, claim.attempt_id, 'failed');
    return { ok: false, status: 502, error: created.message };
  }
  await updatePaymentAttempt(env, claim.attempt_id, 'pending', created.authorizationUrl);
  return { ok: true, authorizationUrl: created.authorizationUrl, reference: created.reference };
}
