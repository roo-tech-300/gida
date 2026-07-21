export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface ExpireResult {
  expired: number;
  ids: string[];
}

async function expireStaleClaims(env: Env): Promise<ExpireResult> {
  const now = new Date().toISOString();
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');

  const url = `${baseUrl}/rest/v1/applications`;
  const params = new URLSearchParams({
    status: 'in.(locked_pending_roommate,locked_pending_payment,partially_paid)',
    lock_expires_at: `lt.${now}`,
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ status: 'expired' }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase PATCH failed: ${response.status} — ${text}`);
  }

  const updated = (await response.json()) as Array<{ id: string }>;
  return { expired: updated.length, ids: updated.map((r) => r.id) };
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    try {
      const result = await expireStaleClaims(env);
      console.log(`[Expiration] Expired ${result.expired} claims: ${result.ids.join(', ')}`);
    } catch (error: any) {
      console.error('[Expiration] Error:', error?.message || String(error));
    }
  },

  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Send a POST request to trigger claim expiration.', { status: 405 });
    }

    try {
      const result = await expireStaleClaims(env);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
