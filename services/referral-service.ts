import { supabase } from '@/lib/supabase';
import type { ReferralEarningsSummary } from '@/types/referral';

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
