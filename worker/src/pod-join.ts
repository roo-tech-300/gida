import type { Env } from './env';
import { json } from './paystack-helpers';

// POST /api/pods/join — atomically add the caller to a friend's pod.
// Verifies the caller's Supabase session, then invokes the SECURITY DEFINER
// RPC sql/add_join_pod_rpc.sql while FORWARDING THE USER'S JWT (the RPC
// derives the joiner from auth.uid(), so service-role-only calls fail).
//
// Every step logs its success ("just finished X, proceeding to Y") and every
// failure logs full context, so production incidents are debuggable line by line.

export type JoinPodResult = {
  creditId: string;
  podId: string;
  amountPaid: number;
  paymentDeadline: string;
  isFinalized: boolean;
  inviteCode: string;
};

type MappedError = { status: number; code: string; message: string };

function mapRpcError(rawMessage: string): MappedError {
  const m = rawMessage.toLowerCase();
  if (m.includes('already a member')) {
    return { status: 409, code: 'ALREADY_MEMBER', message: "You're already part of this group." };
  }
  if (m.includes('already full')) {
    return { status: 409, code: 'POD_FULL', message: 'This group is already full.' };
  }
  if (m.includes('invite code not found')) {
    return { status: 404, code: 'INVITE_NOT_FOUND', message: 'Invite code not found. Ask your friend to share their invite code.' };
  }
  if (m.includes('active reservation')) {
    return { status: 409, code: 'ALREADY_RESERVED', message: 'You already have an active reservation for this property.' };
  }
  if (m.includes('please sign in')) {
    return { status: 401, code: 'UNAUTHENTICATED', message: 'Please sign in to continue.' };
  }
  return { status: 500, code: 'JOIN_FAILED', message: rawMessage || 'Could not join the group. Try again.' };
}

async function verifySession(env: Env, userToken: string): Promise<string | null> {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${userToken}`,
    },
  });
  if (!response.ok) {
    console.error(`[PodJoin] Session verify rejected: ${response.status} — ${await response.text()}`);
    return null;
  }
  const user = (await response.json()) as { id?: string };
  if (!user.id) {
    console.error('[PodJoin] Session verify returned no user id.');
    return null;
  }
  return user.id;
}

async function callJoinRpc(env: Env, userToken: string, code: string): Promise<{ ok: true; result: JoinPodResult } | { ok: false; error: MappedError }> {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/rest/v1/rpc/join_pod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ p_group_code: code }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[PodJoin] Network failure while calling join_pod RPC:', message);
    return { ok: false, error: { status: 502, code: 'RPC_UNREACHABLE', message: 'Could not reach the reservation server. Try again.' } };
  }

  const rawBody = await response.text();
  if (!response.ok) {
    let rpcMessage = '';
    try {
      rpcMessage = (JSON.parse(rawBody) as { message?: string }).message ?? '';
    } catch {
      rpcMessage = rawBody.slice(0, 300);
    }
    console.error(`[PodJoin] join_pod RPC failed: ${response.status} — ${rpcMessage}`);
    return { ok: false, error: mapRpcError(rpcMessage) };
  }

  try {
    const result = JSON.parse(rawBody) as JoinPodResult;
    if (!result.creditId || !result.podId) {
      console.error(`[PodJoin] join_pod RPC returned an unexpected payload: ${rawBody.slice(0, 300)}`);
      return { ok: false, error: { status: 500, code: 'UNEXPECTED_RPC_PAYLOAD', message: 'Reservation saved but the response was malformed. Check the app in a moment.' } };
    }
    return { ok: true, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[PodJoin] Failed to parse join_pod RPC response "${rawBody.slice(0, 300)}":`, message);
    return { ok: false, error: { status: 500, code: 'UNPARSEABLE_RPC_PAYLOAD', message: 'Reservation saved but the response could not be read. Check the app in a moment.' } };
  }
}

async function handleJoin(request: Request, env: Env): Promise<Response> {
  console.log('[PodJoin] ── New join request received ──');

  // Step 1: parse & validate payload.
  console.log('[PodJoin] Step 1/4: parsing the request payload...');
  const body = await request.json().catch(() => null) as { code?: unknown } | null;
  const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!code) {
    console.error('[PodJoin] Step 1/4 FAILED — missing or invalid invite code.');
    return json({ error: 'Missing invite code.', code: 'INVALID_PAYLOAD' }, 400);
  }
  console.log('[PodJoin] Step 1/4 done — just finished parsing the payload, proceeding to session verification.');

  // Step 2: verify the caller's Supabase session.
  console.log('[PodJoin] Step 2/4: verifying the caller\'s Supabase session...');
  const authHeader = request.headers.get('Authorization') ?? '';
  const userToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!userToken) {
    console.error('[PodJoin] Step 2/4 FAILED — no bearer token on the request.');
    return json({ error: 'Please sign in to continue.', code: 'UNAUTHENTICATED' }, 401);
  }
  const userId = await verifySession(env, userToken);
  if (!userId) {
    console.error('[PodJoin] Step 2/4 FAILED — session could not be verified.');
    return json({ error: 'Your session has expired. Please sign in again.', code: 'UNAUTHENTICATED' }, 401);
  }
  console.log(`[PodJoin] Step 2/4 done — just finished verifying the session for user ${userId}, proceeding to the atomic join RPC.`);

  // Step 3: run the atomic join_pod RPC under the user's identity.
  console.log(`[PodJoin] Step 3/4: calling join_pod RPC for code ${code}...`);
  const rpcResult = await callJoinRpc(env, userToken, code);
  if (!rpcResult.ok) {
    console.error(`[PodJoin] Step 3/4 FAILED — mapped error ${rpcResult.error.code}: ${rpcResult.error.message}`);
    return json({ error: rpcResult.error.message, code: rpcResult.error.code }, rpcResult.error.status);
  }
  console.log('[PodJoin] Step 3/4 done — just finished joining the pod, proceeding to build the response.');

  // Step 4: respond.
  console.log(`[PodJoin] Step 4/4 done — SUCCESS! Credit ${rpcResult.result.creditId}, finalized: ${rpcResult.result.isFinalized}.`);
  return json({ joined: true, credit: rpcResult.result });
}

export async function handlePodJoinRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400' } });
  }
  if (url.pathname !== '/api/pods/join' || request.method !== 'POST') {
    return json({ error: 'Not found.' }, 404);
  }

  try {
    return await handleJoin(request, env);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[PodJoin] Unhandled route error:', message);
    return json({ error: 'Something went wrong while joining the group. Try again.', code: 'INTERNAL_ERROR' }, 500);
  }
}
