import type { Env } from './env';
import { json } from './paystack-helpers';

export type PaymentMetadata = {
  kind?: string;
  userId?: string;
  listingId?: string;
  tourBookingId?: string;
  slotCreditId?: string;
  paymentAttemptId?: string;
};

export function requireUuid(value: string | undefined): string | null {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return value && uuidPattern.test(value) ? value : null;
}

export async function authenticatedUserId(request: Request, env: Env): Promise<string | null> {
  const authorization = request.headers.get('Authorization');
  const apikey = request.headers.get('apikey');
  if (!authorization?.startsWith('Bearer ') || !apikey) return null;
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      apikey,
      Authorization: authorization,
    },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { id?: string };
  return requireUuid(user.id);
}

export function jsonError(message: string, status: number): Response {
  return json({ error: message }, status);
}
