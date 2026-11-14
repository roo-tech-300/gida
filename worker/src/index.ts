import type { Env } from './env';
import { handlePayLinkRequest } from './pay-link';
import { handlePaystackRequest } from './paystack';
import { handlePodJoinRequest } from './pod-join';

export type { Env };

interface ExpireResult {
  expired: number;
  ids: string[];
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

  const updated = (await response.json()) as { id: string }[];
  return { expired: updated.length, ids: updated.map((r) => r.id) };
}

/**
 * The rule for which holds have run out lives in the database (public.expire_lapsed_holds): it leaves
 * requests still waiting for an admin alone, since their hold starts at approval, and it updates each
 * household's member count itself.
 */
async function expireStaleSlotCredits(env: Env): Promise<ExpireResult> {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/rest/v1/rpc/expire_lapsed_holds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: '{}',
  });
  if (!response.ok) {
    throw new Error(`expire_lapsed_holds failed: ${response.status} — ${await response.text()}`);
  }
  const expired = Number(await response.json());
  return { expired: Number.isFinite(expired) ? expired : 0, ids: [] };
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

function summarize(result: ExpireResult, label: string): void {
  console.log(`[Expiration] Expired ${result.expired} ${label}${result.ids.length ? `: ${result.ids.join(', ')}` : ''}`);
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const results = await Promise.allSettled([
      expireStaleSlotCredits(env),
      expireStaleTourBookings(env),
    ]);
    const labels = ['slot credits', 'pending tours'];
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

    if (url.pathname.startsWith('/api/pay/')) {
      return handlePayLinkRequest(request, env);
    }

    if (url.pathname.startsWith('/api/pods/')) {
      return handlePodJoinRequest(request, env);
    }

    if (request.method !== 'POST') {
      return new Response('Send a POST request to trigger expiration.', { status: 405 });
    }

    try {
      const [slotCredits, pendingTours] = await Promise.all([
        expireStaleSlotCredits(env),
        expireStaleTourBookings(env),
      ]);
      return new Response(JSON.stringify({ slotCredits, pendingTours }), {
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
