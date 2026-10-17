import type { Env } from './env';
import { json } from './paystack-helpers';
import { authenticatedUserId, jsonError, requireUuid } from './paystack-types';

/**
 * POST /api/referral/disburse
 * Body: { requestId: string }
 *
 * Security:
 * - Caller must be authenticated (valid Supabase JWT)
 * - Caller must be a super_admin (checked against admin_profiles table)
 * - Uses service role key to call the disburse_withdrawal RPC — regular
 *   users cannot call the RPC directly because EXECUTE is revoked from
 *   authenticated and PUBLIC roles in the migration.
 */

async function supabaseRest(env: Env, path: string, init?: RequestInit): Promise<Response> {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const headers = {
    'Content-Type': 'application/json',
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    ...(init?.headers ?? {}),
  };
  return fetch(`${baseUrl}/rest/v1/${path}`, { ...init, headers });
}

async function supabaseRpc(env: Env, fn: string, args: Record<string, unknown>): Promise<Response> {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  return fetch(`${baseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(args),
  });
}

async function isSuperAdmin(env: Env, userId: string): Promise<boolean> {
  const response = await supabaseRest(
    env,
    `admin_profiles?select=role&id=eq.${encodeURIComponent(userId)}&role=eq.super_admin`,
  );
  if (!response.ok) return false;
  const rows = (await response.json()) as unknown[];
  return rows.length > 0;
}

export async function handleDisburse(request: Request, env: Env): Promise<Response> {
  // 1. Authenticate
  const userId = await authenticatedUserId(request, env);
  if (!userId) return jsonError('Authentication required.', 401);

  // 2. Authorise — must be super_admin
  const adminCheck = await isSuperAdmin(env, userId);
  if (!adminCheck) return jsonError('Forbidden. Super admin access required.', 403);

  // 3. Parse and validate body
  const body = (await request.json().catch(() => null)) as { requestId?: unknown } | null;
  const requestId = typeof body?.requestId === 'string' ? requireUuid(body.requestId) : null;
  if (!requestId) return jsonError('Invalid or missing requestId.', 400);

  // 4. Call the disburse_withdrawal RPC via service role — atomic, safe
  const rpcResponse = await supabaseRpc(env, 'disburse_withdrawal', { p_request_id: requestId });

  if (!rpcResponse.ok) {
    const text = await rpcResponse.text();
    console.error('[Disburse] RPC failed:', rpcResponse.status, text);
    // Surface the Postgres exception message to the admin UI
    try {
      const parsed = JSON.parse(text) as { message?: string };
      return jsonError(parsed.message ?? 'Disbursement failed.', 400);
    } catch {
      return jsonError('Disbursement failed.', 500);
    }
  }

  return json({ success: true }, 200);
}
