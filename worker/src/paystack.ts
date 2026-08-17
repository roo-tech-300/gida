import { z } from 'zod';

import type { Env } from './env';
import { confirmTourBooking } from './tour-confirm';
import { confirmSlotPayment } from './slot-confirm';
import { json, paystackHeaders, upsertPayment, type PaymentRow } from './paystack-helpers';

const PAYSTACK_BASE = 'https://api.paystack.co';
const LOCATION_ACCESS_FEE_NGN = 500;
const ASSISTED_TOUR_FEE_NGN = 2000;

async function hmacSha512Hex(secret: string, body: string): Promise<string> {
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

type PaymentMetadata = {
  kind?: string;
  userId?: string;
  listingId?: string;
  tourBookingId?: string;
  slotCreditId?: string;
};

function requireUuid(value: string | undefined): string | null {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return value && uuidPattern.test(value) ? value : null;
}

function paymentAmountKobo(kind: string | undefined, chargedAmount?: number): number {
  if (kind === 'tour') {
    return chargedAmount ?? ASSISTED_TOUR_FEE_NGN * 100;
  }
  return chargedAmount ?? LOCATION_ACCESS_FEE_NGN * 100;
}

function paymentMethod(kind: string | undefined, channel?: string): string {
  if (kind === 'tour') return 'tour';
  if (kind === 'lodge') return 'lodge';
  return channel ?? 'card';
}

function paymentRow(kind: string | undefined, meta: PaymentMetadata, reference: string, chargedAmount?: number, channel?: string): PaymentRow | null {
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

async function handleInitialize(request: Request, env: Env): Promise<Response> {
  const parseResult = z
    .object({
      listingId: z.string(),
      email: z.string().email(),
      callbackUrl: z.string().url(),
      userId: z.string().optional(),
      kind: z.enum(['location', 'tour', 'lodge']).default('location'),
      tourBookingId: z.string().optional(),
      slotCreditId: z.string().optional(),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parseResult.success) {
    return json({ error: 'Invalid payload.' }, 400);
  }

  const { listingId, email, callbackUrl, userId: rawUserId, kind, tourBookingId, slotCreditId } = parseResult.data;
  const userId = requireUuid(rawUserId);
  if (!requireUuid(listingId) || !userId) {
    return json({ error: 'Invalid listing or user id.' }, 400);
  }
  if (kind === 'tour' && !tourBookingId) {
    return json({ error: 'Missing tour booking.' }, 400);
  }
  if (kind === 'lodge' && !slotCreditId) {
    return json({ error: 'Missing slot credit id.' }, 400);
  }

  let amountKobo: number;
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const svcHeaders = {
    'Content-Type': 'application/json',
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };

  if (kind === 'lodge') {
    const creditResp = await fetch(`${baseUrl}/rest/v1/slot_credits?id=eq.${encodeURIComponent(slotCreditId!)}&select=amount_paid,status`, {
      method: 'GET',
      headers: svcHeaders,
    });
    if (!creditResp.ok) {
      return json({ error: 'Could not look up slot credit.' }, 500);
    }
    const rows = (await creditResp.json()) as Array<{ amount_paid: number | null; status: string | null }>;
    const creditRow = rows[0];
    const creditStatus = creditRow?.status;
    if (creditStatus === 'paid_unmatched' || creditStatus === 'matched' || creditStatus === 'subletting') {
      return json({ error: 'This reservation has already been paid for.' }, 409);
    }
    const amountNgn = creditRow?.amount_paid;
    if (!amountNgn || amountNgn <= 0) {
      return json({ error: 'Slot credit has no payment amount set.' }, 400);
    }
    amountKobo = Math.round(amountNgn * 100);
  } else if (kind === 'location') {
    const existingResp = await fetch(
      `${baseUrl}/rest/v1/location_access_payments?user_id=eq.${encodeURIComponent(userId)}&listing_id=eq.${encodeURIComponent(listingId)}&select=id`,
      { method: 'GET', headers: svcHeaders },
    );
    if (existingResp.ok) {
      const existingRows = (await existingResp.json()) as Array<{ id: string }>;
      if (existingRows.length > 0) {
        return json({ error: 'Location access already unlocked for this property.' }, 409);
      }
    }
    amountKobo = paymentAmountKobo(kind);
  } else {
    amountKobo = paymentAmountKobo(kind);
  }

  const reference = `GIDA-${kind.toUpperCase().slice(0, 4)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const metadata: PaymentMetadata = { kind, userId, listingId };
  if (kind === 'tour') {
    metadata.tourBookingId = tourBookingId;
  }
  if (kind === 'lodge') {
    metadata.slotCreditId = slotCreditId;
  }
  const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: paystackHeaders(env),
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
  });

  const result = (await response.json()) as { status: boolean; message?: string; data?: { authorization_url: string; reference: string } };
  if (!response.ok || !result.status || !result.data) {
    return json({ error: result.message ?? 'Failed to initialize payment.' }, 502);
  }
  return json({ authorizationUrl: result.data.authorization_url, reference: result.data.reference });
}

async function handleVerify(request: Request, env: Env): Promise<Response> {
  const parseResult = z.object({ reference: z.string().min(1) }).safeParse(await request.json().catch(() => null));
  if (!parseResult.success) {
    return json({ error: 'Invalid payload.' }, 400);
  }

  const response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(parseResult.data.reference)}`, {
    method: 'GET',
    headers: paystackHeaders(env),
  });
  const result = (await response.json()) as {
    status: boolean;
    data?: { status: string; reference: string; amount?: number; channel?: string; metadata?: PaymentMetadata };
  };

  if (!response.ok || !result.status || result.data?.status !== 'success') {
    return json({ unlocked: false, status: result.data?.status ?? 'failed' }, 200);
  }

  const data = result.data;
  const kind = data.metadata?.kind === 'tour' ? 'tour' : data.metadata?.kind === 'lodge' ? 'lodge' : 'location';

  if (kind === 'lodge' && data.metadata?.slotCreditId) {
    const result = await confirmSlotPayment(env, data.metadata.slotCreditId, data.reference);
    if (!result.confirmed) {
      return json({ unlocked: false, status: 'confirm-failed' }, 500);
    }
    return json({ unlocked: true, kind: 'lodge', slotCreditId: data.metadata.slotCreditId, locationUnlocked: result.locationUnlocked }, 200);
  }

  const row = paymentRow(kind, data.metadata ?? {}, data.reference, data.amount, data.channel);
  if (!row) {
    return json({ unlocked: false, status: 'invalid-metadata' }, 200);
  }

  const persisted = await upsertPayment(env, row);
  if (!persisted) {
    return json({ unlocked: false, status: 'persist-failed' }, 500);
  }

  if (kind === 'tour' && data.metadata?.tourBookingId) {
    await confirmTourBooking(env, data.metadata.tourBookingId);
    return json({ unlocked: true, kind: 'tour', bookingId: data.metadata.tourBookingId }, 200);
  }
  return json({ unlocked: true, kind: 'location', listingId: row.listing_id }, 200);
}

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');
  if (!signature) {
    return json({ error: 'Missing signature.' }, 401);
  }

  const expected = await hmacSha512Hex(env.PAYSTACK_SECRET_KEY, rawBody);
  if (expected !== signature) {
    return json({ error: 'Invalid signature.' }, 401);
  }

  const payload = JSON.parse(rawBody) as {
    event?: string;
    data?: { status?: string; reference?: string; amount?: number; channel?: string; metadata?: PaymentMetadata };
  };
  if (payload.event !== 'charge.success' || payload.data?.status !== 'success') {
    return json({ received: true });
  }

  const data = payload.data;
  const kind = data.metadata?.kind === 'tour' ? 'tour' : data.metadata?.kind === 'lodge' ? 'lodge' : 'location';
  if (!data.reference) {
    return json({ received: true });
  }

  if (kind === 'lodge' && data.metadata?.slotCreditId) {
    const result = await confirmSlotPayment(env, data.metadata.slotCreditId, data.reference);
    if (!result.confirmed) {
      console.error(`[Webhook] Lodge confirm failed for credit ${data.metadata.slotCreditId}`);
    }
    return json({ received: true });
  }

  const row = paymentRow(kind, data.metadata ?? {}, data.reference, data.amount, data.channel);
  if (!row) {
    return json({ received: true });
  }

  await upsertPayment(env, row);
  if (kind === 'tour' && data.metadata?.tourBookingId) {
    await confirmTourBooking(env, data.metadata.tourBookingId);
  }
  return json({ received: true });
}

export async function handlePaystackRequest(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/paystack/') && request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-paystack-signature',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    if (url.pathname === '/api/paystack/initialize' && request.method === 'POST') {
      return handleInitialize(request, env);
    }
    if (url.pathname === '/api/paystack/verify' && request.method === 'POST') {
      return handleVerify(request, env);
    }
    if (url.pathname === '/api/paystack/webhook' && request.method === 'POST') {
      return handleWebhook(request, env);
    }
    return json({ error: 'Not found.' }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Paystack] Route error:', message);
    return json({ error: message }, 500);
  }
}
