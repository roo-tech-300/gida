export interface MockReferral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referrer_name: string;
  referred_name: string;
  referral_code: string;
  created_at: string;
}

export interface MockReferralPayment {
  id: string;
  referral_id: string;
  payout_to: string;
  referred_user_id: string;
  referred_name: string;
  amount: number; // in kobo
  status: 'pending' | 'paid';
  paid_at?: string | null;
  created_at: string;
  source_reference?: string;
}

export const mockReferrals: MockReferral[] = [
  {
    id: 'ref-001',
    referrer_id: 'user-001',
    referred_id: 'user-002',
    referrer_name: 'Danjuma Ibrahim',
    referred_name: 'Amina Sanusi',
    referral_code: 'GIDA7XK2',
    created_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'ref-002',
    referrer_id: 'user-001',
    referred_id: 'user-003',
    referrer_name: 'Danjuma Ibrahim',
    referred_name: 'Chidi Okafor',
    referral_code: 'GIDA7XK2',
    created_at: '2026-09-15T14:30:00Z',
  },
];

export const mockReferralPayments: MockReferralPayment[] = [
  {
    id: 'rp-001',
    referral_id: 'ref-001',
    payout_to: 'user-001',
    referred_user_id: 'user-002',
    referred_name: 'Amina Sanusi',
    amount: 200000, // ₦2,000
    status: 'pending',
    created_at: '2026-09-05T08:00:00Z',
    source_reference: 'paystack_ref_abc123',
  },
  {
    id: 'rp-002',
    referral_id: 'ref-002',
    payout_to: 'user-001',
    referred_user_id: 'user-003',
    referred_name: 'Chidi Okafor',
    amount: 200000, // ₦2,000
    status: 'paid',
    created_at: '2026-09-20T16:45:00Z',
    paid_at: '2026-09-25T10:00:00Z',
    source_reference: 'paystack_ref_def456',
  },
];

export const mockReferralEarnings = {
  total_pending: 200000, // ₦2,000
  total_paid: 200000, // ₦2,000
  pending_count: 1,
  paid_count: 1,
};