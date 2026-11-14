import { z } from 'zod';

import type { Env } from './env';
import { json } from './paystack-helpers';
import { startLodgePayment } from './lodge-payment';
import { allowRequest } from './rate-limit';

const DEFAULT_PAY_PAGE_ORIGIN = 'https://gida.apartments';
const TOKEN_PATTERN = /^[0-9a-f]{32}$/;
const REQUESTS_PER_MINUTE = 30;

type LinkStatus = 'open' | 'paid' | 'expired' | 'not_ready' | 'not_found';

/** Row returned by the get_payment_link SQL function. Never sent to the browser as-is. */
type LinkRecord = {
  status: LinkStatus;
  credit_id?: string;
  student_id?: string;
  listing_id?: string;
  listing_title?: string | null;
  location?: string | null;
  student_first_name?: string | null;
  amount?: number | null;
  deadline?: string;
  target_occupancy?: number | null;
};

async function lookupLink(env: Env, token: string): Promise<LinkRecord | null> {
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/get_payment_link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_token: token }),
  });
  if (!response.ok) {
    console.error(`[PayLink] Lookup failed: ${response.status} — ${await response.text()}`);
    return null;
  }
  return (await response.json()) as LinkRecord;
}

/** What the parent's page may see: no user ids, no reservation ids. */
function publicSummary(record: LinkRecord) {
  return {
    status: record.status,
    listingTitle: record.listing_title ?? null,
    location: record.location ?? null,
    studentFirstName: record.student_first_name ?? null,
    amount: record.amount ?? null,
    deadline: record.deadline ?? null,
    targetOccupancy: record.target_occupancy ?? null,
  };
}

async function handleSummary(env: Env, token: string): Promise<Response> {
  const record = await lookupLink(env, token);
  if (!record) return json({ error: 'Could not load this payment link.' }, 502);
  return json(publicSummary(record), record.status === 'not_found' ? 404 : 200);
}

async function handleInitialize(request: Request, env: Env, token: string): Promise<Response> {
  const parsed = z.object({ email: z.string().email() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Enter a valid email address.' }, 400);

  const record = await lookupLink(env, token);
  if (!record) return json({ error: 'Could not load this payment link.' }, 502);
  if (record.status !== 'open') return json({ error: 'This link cannot be paid.', status: record.status }, 409);
  if (!record.amount || record.amount <= 0 || !record.credit_id || !record.student_id || !record.listing_id) {
    return json({ error: 'This reservation has no amount to pay.' }, 400);
  }

  const origin = (env.PAY_PAGE_ORIGIN ?? DEFAULT_PAY_PAGE_ORIGIN).replace(/\/$/, '');
  const started = await startLodgePayment(env, {
    creditId: record.credit_id,
    userId: record.student_id,
    listingId: record.listing_id,
    email: parsed.data.email,
    callbackUrl: `${origin}/pay/${token}`,
    paidBy: 'parent',
  });
  return started.ok ? json({ authorizationUrl: started.authorizationUrl, reference: started.reference }) : json({ error: started.error }, started.status);
}

export async function handlePayLinkRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  if (!allowRequest(request, REQUESTS_PER_MINUTE)) {
    return json({ error: 'Too many requests. Please wait a minute and try again.' }, 429);
  }

  const match = url.pathname.match(/^\/api\/pay\/([^/]+)(\/initialize)?$/);
  if (!match || !TOKEN_PATTERN.test(match[1])) return json({ error: 'Not found.' }, 404);

  try {
    if (!match[2] && request.method === 'GET') return await handleSummary(env, match[1]);
    if (match[2] && request.method === 'POST') return await handleInitialize(request, env, match[1]);
    return json({ error: 'Not found.' }, 404);
  } catch (error) {
    console.error('[PayLink] Route error:', error instanceof Error ? error.message : String(error));
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}
