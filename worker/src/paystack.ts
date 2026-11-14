import { z } from 'zod';

import type { Env } from './env';
import { confirmTourBooking } from './tour-confirm';
import { confirmSlotPayment } from './slot-confirm';
import { createPaystackTransaction, json, paystackBase, paystackHeaders, upsertPayment } from './paystack-helpers';
import { startLodgePayment } from './lodge-payment';
import { type PaymentMetadata, hmacSha512Hex, paymentAmountKobo, paymentRow, requireUuid } from './payment-meta';

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
    const started = await startLodgePayment(env, { creditId: slotCreditId!, userId, listingId, email, callbackUrl, paidBy: 'student' });
    return started.ok ? json({ authorizationUrl: started.authorizationUrl, reference: started.reference }) : json({ error: started.error }, started.status);
  }

  if (kind === 'location') {
    const existingResp = await fetch(
      `${baseUrl}/rest/v1/location_access_payments?user_id=eq.${encodeURIComponent(userId)}&listing_id=eq.${encodeURIComponent(listingId)}&select=id`,
      { method: 'GET', headers: svcHeaders },
    );
    if (existingResp.ok) {
      const existingRows = (await existingResp.json()) as { id: string }[];
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
  const created = await createPaystackTransaction(env, { email, amountKobo, reference, callbackUrl, metadata });
  if (!created.ok) {
    return json({ error: created.message }, 502);
  }
  return json({ authorizationUrl: created.authorizationUrl, reference: created.reference });
}

async function handleVerify(request: Request, env: Env): Promise<Response> {
  const parseResult = z.object({ reference: z.string().min(1) }).safeParse(await request.json().catch(() => null));
  if (!parseResult.success) {
    return json({ error: 'Invalid payload.' }, 400);
  }

  const response = await fetch(`${paystackBase(env)}/transaction/verify/${encodeURIComponent(parseResult.data.reference)}`, {
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
    const result = await confirmSlotPayment(env, data.metadata.slotCreditId, data.reference, {
      paidBy: data.metadata.paidBy === 'parent' ? 'parent' : 'student',
      amountKobo: data.amount,
    });
    if (result.refunded !== undefined) {
      // The reservation had ended, so the money is going back rather than buying a spot.
      return json({ unlocked: false, status: result.refunded ? 'refunded' : 'refund-failed' }, 200);
    }
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
    const result = await confirmSlotPayment(env, data.metadata.slotCreditId, data.reference, {
      paidBy: data.metadata.paidBy === 'parent' ? 'parent' : 'student',
      amountKobo: data.amount,
    });
    if (result.refunded === false) {
      console.error(`[Webhook] A payment for an ended reservation could NOT be refunded: credit ${data.metadata.slotCreditId}, reference ${data.reference}`);
    } else if (!result.confirmed && result.refunded === undefined) {
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
