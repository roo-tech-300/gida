import type { Env } from './env';

export type PaymentKind = 'lodge' | 'tour' | 'location';
export type AttemptStatus = 'initializing' | 'pending' | 'paid' | 'failed' | 'refunded' | 'refund_failed';

export type PaymentAttemptClaim = {
  decision: 'new' | 'reuse' | 'initializing' | 'already_paid' | 'not_found' | 'not_payable' | 'invalid_purchase';
  attempt_id: string | null;
  reference: string | null;
  authorization_url: string | null;
  attempt_status: AttemptStatus | null;
  amount_ngn: number | null;
  is_new: boolean;
};

function serviceHeaders(env: Env): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
}

export async function claimPaymentAttempt(
  env: Env,
  input: { kind: PaymentKind; purchaseId: string; userId: string; listingId: string },
): Promise<PaymentAttemptClaim> {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/rest/v1/rpc/claim_payment_attempt`, {
    method: 'POST',
    headers: serviceHeaders(env),
    body: JSON.stringify({
      p_purchase_kind: input.kind,
      p_purchase_id: input.purchaseId,
      p_user_id: input.userId,
      p_listing_id: input.listingId,
    }),
  });
  if (!response.ok) {
    const details = await response.text();
    console.error(`[PaymentAttempt] Claim failed: ${response.status} — ${details}`);
    throw new Error('Could not confirm payment status. Please try again.');
  }
  const result = (await response.json()) as PaymentAttemptClaim[];
  if (!result[0]) throw new Error('Payment service returned an invalid status response.');
  return result[0];
}

export async function updatePaymentAttempt(
  env: Env,
  attemptId: string,
  status: AttemptStatus,
  authorizationUrl?: string,
): Promise<boolean> {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const response = await fetch(
    `${baseUrl}/rest/v1/payment_attempts?id=eq.${encodeURIComponent(attemptId)}`,
    {
      method: 'PATCH',
      headers: { ...serviceHeaders(env), Prefer: 'return=minimal' },
      body: JSON.stringify({
        status,
        ...(authorizationUrl ? { authorization_url: authorizationUrl } : {}),
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if (!response.ok) {
    console.error(`[PaymentAttempt] Failed to mark attempt ${attemptId} as ${status}: ${await response.text()}`);
    return false;
  }
  return true;
}

/** Records how a payment ended, found by its reference. Never throws: the payment itself is already settled. */
export async function markAttemptByReference(env: Env, purchaseId: string, reference: string, status: AttemptStatus): Promise<void> {
  try {
    const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
    const response = await fetch(
      `${baseUrl}/rest/v1/payment_attempts?purchase_kind=eq.lodge&purchase_id=eq.${encodeURIComponent(purchaseId)}&reference=eq.${encodeURIComponent(reference)}`,
      {
        method: 'PATCH',
        headers: { ...serviceHeaders(env), Prefer: 'return=minimal' },
        body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
      },
    );
    if (!response.ok) console.error(`[PaymentAttempt] Could not mark ${reference} as ${status}: ${await response.text()}`);
  } catch (error) {
    console.error(`[PaymentAttempt] Could not mark ${reference} as ${status}:`, error instanceof Error ? error.message : String(error));
  }
}

/** The recorded status of the attempt with this reference, or null when none is recorded. */
export async function attemptStatusByReference(env: Env, purchaseId: string, reference: string): Promise<AttemptStatus | null> {
  try {
    const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
    const response = await fetch(
      `${baseUrl}/rest/v1/payment_attempts?purchase_kind=eq.lodge&purchase_id=eq.${encodeURIComponent(purchaseId)}&reference=eq.${encodeURIComponent(reference)}&select=status`,
      { method: 'GET', headers: serviceHeaders(env) },
    );
    if (!response.ok) return null;
    const rows = (await response.json()) as { status: AttemptStatus }[];
    return rows[0]?.status ?? null;
  } catch {
    return null;
  }
}
