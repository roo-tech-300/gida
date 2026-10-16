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

