import { supabase } from '@/lib/supabase';
import type {
  ReferralEarningsSummary,
  ReferralPaymentStatus,
  ReferralWithProfile,
  WithdrawalRequest,
  WithdrawalRequestWithProfile,
} from '@/types/referral';

const REFERRAL_CODE_LENGTH = 24;
const REFERRAL_CODE_CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += REFERRAL_CODE_CHARACTERS.charAt(Math.floor(Math.random() * REFERRAL_CODE_CHARACTERS.length));
  }
  return code;
}

export async function ensureReferralCode(userId: string): Promise<string | null> {
  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing?.referral_code) {
    return existing.referral_code;
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateReferralCode();
    const { data: taken, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle();

    if (checkError) throw checkError;
    if (!taken) {
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ referral_code: code })
        .eq('id', userId)
        .is('referral_code', null)
        .select('referral_code')
        .maybeSingle();

      if (!updateError && updated?.referral_code) return updated.referral_code;
      if (updateError && updateError.code !== '23505') throw updateError;

      const { data: raced, error: racedError } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .maybeSingle();
      if (racedError) throw racedError;
      if (raced?.referral_code) return raced.referral_code;
    }
  }

  throw new Error('Unable to allocate a unique referral code after 10 attempts.');
}

export function buildReferralLink(referralCode: string): string {
  return `https://www.gida.apartments/r/${encodeURIComponent(referralCode)}`;
}

export function buildReferralDeepLink(referralCode: string): string {
  return `gida://referral?code=${encodeURIComponent(referralCode)}`;
}

export async function fetchReferralEarningsSummary(payoutTo: string): Promise<ReferralEarningsSummary> {
  const { data: payments, error } = await supabase
    .from('referral_payments')
    .select('amount, status')
    .eq('payout_to', payoutTo)
    .order('created_at', { ascending: false });

  if (error) throw error;

  let totalPending = 0;
  let totalPaid = 0;
  let pendingCount = 0;
  let paidCount = 0;

  for (const p of payments ?? []) {
    if (p.status === 'pending') {
      totalPending += p.amount;
      pendingCount++;
    } else if (p.status === 'paid') {
      totalPaid += p.amount;
      paidCount++;
    }
  }

  return { total_pending: totalPending, total_paid: totalPaid, pending_count: pendingCount, paid_count: paidCount };
}

const REFERRAL_PAGE_SIZE = 20;

type PaymentStatusRow = { status?: unknown };

/** 'paid' wins: any disbursed payment means the admin has paid out. */
function toPaymentStatus(payments: PaymentStatusRow[] | null | undefined): ReferralPaymentStatus {
  if (!Array.isArray(payments) || payments.length === 0) return 'none';
  const statuses = payments.map((p) => (typeof p.status === 'string' ? p.status : ''));
  if (statuses.includes('paid')) return 'paid';
  return 'pending';
}

type ReferralProfileRow = {
  full_name: string | null;
  avatar_url: string | null;
} | null;

type ReferralRpcRow = {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  created_at: string;
  referred_profile: ReferralProfileRow;
};

type ReferralPaymentRpcRow = {
  status: unknown;
  referrals: ReferralRpcRow | null;
};

type ReferralListRow = ReferralRpcRow & {
  referral_payments: PaymentStatusRow[] | null;
};

// Paginated list of people this user referred.
// filter='all' → everyone | filter='paid' → only those who bought a lodge
export async function fetchMyReferrals(
  userId: string,
  page: number,
  filter: 'all' | 'paid',
): Promise<ReferralWithProfile[]> {
  const from = (page - 1) * REFERRAL_PAGE_SIZE;
  const to = from + REFERRAL_PAGE_SIZE - 1;

  if (filter === 'paid') {
    // Fetch referrals that have at least one referral_payment row (i.e. referred user paid)
    const { data, error } = await supabase
      .from('referral_payments')
      .select(`
        referral_id,
        status,
        referrals!inner (
          id, referrer_id, referred_id, referral_code, created_at,
          referred_profile:profiles!referrals_referred_id_fkey (
            full_name, avatar_url
          )
        )
      `)
      .eq('referrals.referrer_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Group payments by referral — one referral may have multiple payments
    const byReferral = new Map<string, { referral: ReferralRpcRow; statuses: string[] }>();
    for (const row of (data ?? []) as ReferralPaymentRpcRow[]) {
      const r = row.referrals;
      if (!r) continue;
      const entry = byReferral.get(r.id) ?? { referral: r, statuses: [] };
      if (typeof row.status === 'string') entry.statuses.push(row.status);
      byReferral.set(r.id, entry);
    }
    return [...byReferral.values()].map(({ referral: r, statuses }) => ({
      id: r.id,
      referrer_id: r.referrer_id,
      referred_id: r.referred_id,
      referral_code: r.referral_code,
      created_at: r.created_at,
      referred_profile: r.referred_profile ?? null,
      payment_status: toPaymentStatus(statuses.map((status) => ({ status }))),
    }));
  }

  // filter === 'all'
  const { data, error } = await supabase
    .from('referrals')
    .select(`
      id, referrer_id, referred_id, referral_code, created_at,
      referred_profile:profiles!referrals_referred_id_fkey (
        full_name, avatar_url
      ),
      referral_payments (status)
    `)
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return ((data ?? []) as ReferralListRow[]).map((r) => ({
    id: r.id,
    referrer_id: r.referrer_id,
    referred_id: r.referred_id,
    referral_code: r.referral_code,
    created_at: r.created_at,
    referred_profile: r.referred_profile ?? null,
    payment_status: toPaymentStatus(r.referral_payments),
  }));
}

// Submit a withdrawal request.
// Uses the request_withdrawal RPC so the amount is calculated server-side
// from actual pending referral_payments — the client cannot inflate it.
export async function submitWithdrawalRequest(
  _userId: string, // kept for API compatibility but not used — RPC uses auth.uid()
  _amount: number, // ignored — server calculates the real amount
  bankDetails: { bank_name: string; account_number: string; account_name: string },
): Promise<WithdrawalRequest> {
  const { data, error } = await supabase.rpc('request_withdrawal', {
    p_bank_name:      bankDetails.bank_name,
    p_account_number: bankDetails.account_number,
    p_account_name:   bankDetails.account_name,
  });

  if (error) throw error;

  // Fetch the newly created request to return the full row
  const { data: row, error: fetchError } = await supabase
    .from('referral_withdrawal_requests')
    .select('*')
    .eq('id', data as string)
    .single();

  if (fetchError) throw fetchError;
  return row as WithdrawalRequest;
}

// Save bank details to the user's profile
export async function saveBankDetails(
  userId: string,
  details: { bank_name: string; account_number: string; account_name: string },
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      payout_bank_name: details.bank_name,
      payout_account_number: details.account_number,
      payout_account_name: details.account_name,
    })
    .eq('id', userId);

  if (error) throw error;
}

// Fetch user's own withdrawal requests
export async function fetchMyWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]> {
  const { data, error } = await supabase
    .from('referral_withdrawal_requests')
    .select('*')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as WithdrawalRequest[];
}

// ─── Admin functions ──────────────────────────────────────────────────────────

const ADMIN_PAGE_SIZE = 30;

// Fetch all pending withdrawal requests with user profile info (super admin only)
export async function fetchPendingWithdrawalRequests(
  page = 1,
): Promise<WithdrawalRequestWithProfile[]> {
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from('referral_withdrawal_requests')
    .select(`
      *,
      profile:profiles!referral_withdrawal_requests_user_id_fkey (
        full_name, email
      )
    `)
    .eq('status', 'pending')
    .order('requested_at', { ascending: true })
    .range(from, to);

  if (error) throw error;
  return (data ?? []) as WithdrawalRequestWithProfile[];
}

// Disburse a withdrawal — calls the worker which uses service_role to run
// the disburse_withdrawal RPC. Regular clients cannot call this RPC directly.
export async function disburseWithdrawal(requestId: string): Promise<void> {
  const workerUrl = process.env.EXPO_PUBLIC_WORKER_URL;
  if (!workerUrl) throw new Error('Worker URL not configured.');

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const apikey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !apikey) throw new Error('Not authenticated.');

  const response = await fetch(`${workerUrl}/api/referral/disburse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey,
    },
    body: JSON.stringify({ requestId }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? 'Disbursement failed.');
  }
}

