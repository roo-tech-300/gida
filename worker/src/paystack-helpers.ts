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
