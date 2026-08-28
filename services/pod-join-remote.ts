import { supabase } from '@/lib/supabase';
import type { SlotCredit } from '@/types/liquidity';

// Client side of the atomic pod join. Prefers the worker endpoint
// (POST /api/pods/join) and lets callers fall back to supabase.rpc('join_pod')
// when the worker is not configured or unreachable.

export const PERSIST_FAILURE_MESSAGE = 'Could not persist your reservation to the server. Please try again.';

export type PodJoinErrorCode =
  | 'ALREADY_MEMBER'
  | 'POD_FULL'
  | 'INVITE_NOT_FOUND'
  | 'ALREADY_RESERVED'
  | 'UNAUTHENTICATED'
  | 'JOIN_FAILED';

export class PodJoinError extends Error {
  readonly code: PodJoinErrorCode;

  constructor(code: PodJoinErrorCode, message: string) {
    super(message);
    this.name = 'PodJoinError';
    this.code = code;
  }
}

export type PodJoinRemoteCredit = {
  creditId?: string;
  podId?: string;
  amountPaid?: number;
  paymentDeadline?: string;
  isFinalized?: boolean;
  inviteCode?: string;
};

export type RemoteJoinOutcome =
  | { kind: 'skipped' }
  | { kind: 'joined'; credit: PodJoinRemoteCredit }
  | { kind: 'failed'; error: PodJoinError };

type WorkerJoinResponse = {
  joined?: boolean;
  credit?: PodJoinRemoteCredit;
  error?: string;
  code?: string;
};

const FRIENDLY_MESSAGES: Record<PodJoinErrorCode, string> = {
  ALREADY_MEMBER: "You're already part of this group.",
  POD_FULL: 'This group is already full. Pick another invite code or a lower occupancy.',
  INVITE_NOT_FOUND: 'Invite code not found. Ask your friend to share their invite code.',
  ALREADY_RESERVED: 'You already have an active reservation for this property.',
  UNAUTHENTICATED: 'Please sign in to continue.',
  JOIN_FAILED: 'Could not join the group right now. Please try again.',
};

export function podJoinErrorMessage(code: PodJoinErrorCode): string {
  return FRIENDLY_MESSAGES[code];
}

function workerUrl(): string {
  return (process.env.EXPO_PUBLIC_WORKER_URL ?? '').replace(/\/$/, '');
}

// Maps raw failure text (worker JSON error or PostgREST RAISE EXCEPTION message).
export function mapJoinFailure(rawMessage: string): PodJoinError {
  const message = rawMessage.toLowerCase();
  if (message.includes('already a member') || message.includes('already part of this group')) {
    return new PodJoinError('ALREADY_MEMBER', podJoinErrorMessage('ALREADY_MEMBER'));
  }
  if (message.includes('already full')) {
    return new PodJoinError('POD_FULL', podJoinErrorMessage('POD_FULL'));
  }
  if (message.includes('invite code not found')) {
    return new PodJoinError('INVITE_NOT_FOUND', podJoinErrorMessage('INVITE_NOT_FOUND'));
  }
  if (message.includes('active reservation')) {
    return new PodJoinError('ALREADY_RESERVED', podJoinErrorMessage('ALREADY_RESERVED'));
  }
  if (message.includes('sign in')) {
    return new PodJoinError('UNAUTHENTICATED', podJoinErrorMessage('UNAUTHENTICATED'));
  }
  console.error('[PodJoin] Unmapped join failure:', rawMessage);
  return new PodJoinError('JOIN_FAILED', rawMessage || podJoinErrorMessage('JOIN_FAILED'));
}

async function readAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch (error) {
    console.error('[PodJoin] Failed to read the Supabase access token:', error);
    return null;
  }
}

export async function joinPodViaWorker(code: string): Promise<RemoteJoinOutcome> {
  const base = workerUrl();
  if (!base) return { kind: 'skipped' };
  const token = await readAccessToken();
  if (!token) return { kind: 'skipped' };

  let response: Response;
  try {
    response = await fetch(`${base}/api/pods/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code }),
    });
  } catch (error) {
    console.error('[PodJoin] Worker unreachable, falling back to the direct RPC:', error);
    return { kind: 'skipped' };
  }

  const payload = (await response.json().catch(() => null)) as WorkerJoinResponse | null;
  if (!response.ok || !payload?.joined || !payload.credit) {
    console.error(`[PodJoin] Worker rejected the join (${response.status}):`, payload?.error ?? 'empty response');
    const knownCode = payload?.code ?? '';
    if (knownCode in FRIENDLY_MESSAGES && knownCode !== 'JOIN_FAILED') {
      return { kind: 'failed', error: new PodJoinError(knownCode as PodJoinErrorCode, podJoinErrorMessage(knownCode as PodJoinErrorCode)) };
    }
    return { kind: 'failed', error: mapJoinFailure(payload?.error ?? '') };
  }
  return { kind: 'joined', credit: payload.credit };
}

export function applyRemoteCredit(credit: SlotCredit, remote: PodJoinRemoteCredit): void {
  if (remote.creditId) credit.id = remote.creditId;
  if (typeof remote.amountPaid === 'number' && remote.amountPaid > 0) credit.amount_paid = remote.amountPaid;
  if (remote.paymentDeadline) credit.payment_deadline = remote.paymentDeadline;
  if (remote.inviteCode) credit.invite_code = remote.inviteCode;
}

export async function joinPodViaRpc(code: string, credit: SlotCredit): Promise<void> {
  try {
    const { data, error } = await supabase.rpc('join_pod', { p_group_code: code.trim().toUpperCase() });
    if (error) {
      console.error('[LiquidityService] join_pod RPC failed:', error.message);
      throw mapJoinFailure(error.message);
    }
    if (data && typeof data === 'object') {
      applyRemoteCredit(credit, data as PodJoinRemoteCredit);
    }
  } catch (error) {
    if (error instanceof PodJoinError) throw error;
    console.error('[LiquidityService] Exception during join_pod RPC:', error);
    throw new PodJoinError('JOIN_FAILED', PERSIST_FAILURE_MESSAGE);
  }
}
