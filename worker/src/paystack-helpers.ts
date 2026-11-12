import type { Env } from './env';

export const SUPABASE_TABLE = 'location_access_payments';

export type PaymentRow = {
  user_id: string;
  listing_id: string;
  amount_paid: number;
  method: string;
  reference: string;
  status: string;
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-paystack-signature',
    },
  });
}

export function paystackHeaders(env: Env): Record<string, string> {
  return {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function upsertPayment(env: Env, row: PaymentRow): Promise<boolean> {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}/rest/v1/${SUPABASE_TABLE}?on_conflict=user_id,listing_id`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[Paystack] Supabase upsert failed: ${response.status} — ${text}`);
    return false;
  }
  return true;
}

const DEFAULT_PAYSTACK_BASE = 'https://api.paystack.co';

export function paystackBase(env: Env): string {
  return (env.PAYSTACK_BASE_URL ?? DEFAULT_PAYSTACK_BASE).replace(/\/$/, '');
}

export type PaystackInitInput = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
};

export type PaystackInitResult =
  | { ok: true; authorizationUrl: string; reference: string }
  | { ok: false; message: string };

/** Starts a Paystack transaction. Shared by the signed-in checkout and the parent pay link. */
export async function createPaystackTransaction(env: Env, input: PaystackInitInput): Promise<PaystackInitResult> {
  const response = await fetch(`${paystackBase(env)}/transaction/initialize`, {
    method: 'POST',
    headers: paystackHeaders(env),
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
  const result = (await response.json().catch(() => null)) as
    | { status?: boolean; message?: string; data?: { authorization_url: string; reference: string } }
    | null;
  if (!response.ok || !result?.status || !result.data) {
    return { ok: false, message: result?.message ?? 'Failed to initialize payment.' };
  }
  return { ok: true, authorizationUrl: result.data.authorization_url, reference: result.data.reference };
}
