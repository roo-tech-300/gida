import type { Env } from './env';

export type PaymentKind = 'lodge' | 'tour' | 'location';
export type AttemptStatus = 'initializing' | 'pending' | 'paid' | 'failed';

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
