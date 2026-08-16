import type { Env } from './env';
import { handlePaystackRequest } from './paystack';

export type { Env };

interface ExpireResult {
  expired: number;
  ids: string[];
}

interface SlotCreditExpireResult extends ExpireResult {
  podsReconciled: number;
}

async function patchExpired(baseUrl: string, key: string, table: string, filter: string): Promise<ExpireResult> {
  const url = `${baseUrl}/rest/v1/${table}`;
  const response = await fetch(`${url}?${filter}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ status: 'expired' }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase PATCH on ${table} failed: ${response.status} — ${text}`);
  }

  const updated = (await response.json()) as Array<{ id: string }>;
  return { expired: updated.length, ids: updated.map((r) => r.id) };
}

async function expireStaleClaims(env: Env): Promise<ExpireResult> {
  const now = new Date().toISOString();
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const params = new URLSearchParams({
    status: 'in.(locked_pending_roommate,locked_pending_payment,partially_paid)',
    lock_expires_at: `lt.${now}`,
  });
  return patchExpired(baseUrl, env.SUPABASE_SERVICE_ROLE_KEY, 'applications', params.toString());
}

async function reconcileExpiredPods(baseUrl: string, key: string, expiredCreditIds: string[]): Promise<number> {
  if (expiredCreditIds.length === 0) {
    return 0;
  }
  const headers = {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
  let reconciled = 0;
  for (const creditId of expiredCreditIds) {
    try {
      const response = await fetch(`${baseUrl}/rest/v1/rpc/reconcile_pod_after_credit_expiry`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_slot_credit_id: creditId }),
      });
      if (!response.ok) {
        console.error(`[Expiration] Pod reconcile RPC failed for ${creditId}: ${response.status} — ${await response.text()}`);
        continue;
      }
      const podId = (await response.json()) as string | null;
      if (podId) {
        reconciled += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Expiration] Pod reconcile exception for ${creditId}: ${message}`);
    }
  }
  return reconciled;
}

async function expireStaleSlotCredits(env: Env): Promise<SlotCreditExpireResult> {
  const now = new Date().toISOString();
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const params = new URLSearchParams({
    status: 'eq.booked_pending_claim',
    payment_deadline: `lt.${now}`,
  });
  const result = await patchExpired(baseUrl, env.SUPABASE_SERVICE_ROLE_KEY, 'slot_credits', params.toString());
  const podsReconciled = await reconcileExpiredPods(baseUrl, env.SUPABASE_SERVICE_ROLE_KEY, result.ids);
  return { ...result, podsReconciled };
}

async function expireStaleTourBookings(env: Env): Promise<ExpireResult> {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const params = new URLSearchParams({
    status: 'eq.pending_payment',
    created_at: `lt.${cutoff}`,
  });
  return patchExpired(baseUrl, env.SUPABASE_SERVICE_ROLE_KEY, 'tour_bookings', params.toString());
}

function summarize(result: ExpireResult | SlotCreditExpireResult, label: string): void {
  let message = `[Expiration] Expired ${result.expired} ${label}: ${result.ids.join(', ')}`;
  if ('podsReconciled' in result) {
    message += `; reconciled ${result.podsReconciled} pods`;
  }
  console.log(message);
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const results = await Promise.allSettled([
      expireStaleClaims(env),
      expireStaleSlotCredits(env),
      expireStaleTourBookings(env),
    ]);
    const labels = ['claims', 'slot credits', 'pending tours'];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        summarize(result.value, labels[index]);
      } else {
        console.error(`[Expiration] Error expiring ${labels[index]}:`, result.reason?.message || String(result.reason));
      }
    });
  },

  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/paystack/')) {
      return handlePaystackRequest(request, env);
    }

    if (request.method !== 'POST') {
      return new Response('Send a POST request to trigger expiration.', { status: 405 });
    }

    try {
      const [claims, slotCredits, pendingTours] = await Promise.all([
        expireStaleClaims(env),
        expireStaleSlotCredits(env),
        expireStaleTourBookings(env),
      ]);
      return new Response(JSON.stringify({ claims, slotCredits, pendingTours }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
