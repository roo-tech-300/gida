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

export type ReferralWithProfile = Referral & {
  referred_profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  has_paid: boolean; // true if referred user has at least one referral_payment row for this referral
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

