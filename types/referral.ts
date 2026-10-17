export type ReferralEarningsSummary = {
  total_pending: number; // in kobo
  total_paid: number; // in kobo
  pending_count: number;
  paid_count: number;
};

export type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  created_at: string;
};

export type ReferralPaymentStatus = 'none' | 'pending' | 'paid';

export type ReferralWithProfile = Referral & {
  referred_profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  /**
   * 'paid' — admin has disbursed the payout for this referral.
   * 'pending' — lodge bought, payout still awaiting admin approval.
   * 'none' — joined, no purchase yet.
   */
  payment_status: ReferralPaymentStatus;
};

export type WithdrawalRequest = {
  id: string;
  user_id: string;
  amount: number; // in kobo
  status: 'pending' | 'paid' | 'rejected';
  bank_name: string;
  account_number: string;
  account_name: string;
  admin_note: string | null;
  requested_at: string;
  resolved_at: string | null;
};

export type WithdrawalRequestWithProfile = WithdrawalRequest & {
  profile: {
    full_name: string | null;
    email: string | null;
  } | null;
};

