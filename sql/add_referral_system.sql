-- Migration: Referral system
-- 1) Add referral_code to profiles
-- 2) Create referrals table (relationship only, no money)
-- 3) Create referral_payments table (one row per payout event)

-- 1) Referral code on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text;

-- Case-insensitive uniqueness for referral_code (nullable; only enforces on non-null)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_lower_uniq
  ON public.profiles (LOWER(referral_code))
  WHERE referral_code IS NOT NULL;

-- 2) Referrals table — who referred whom. One row per relationship.
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referrals_referred_id_unique UNIQUE (referred_id)
);

-- Index for fast lookups by referrer and by referred
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referred_id_idx ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS referrals_referral_code_idx ON public.referrals(referral_code);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Referrers can read their own referral relationships.
CREATE POLICY "Referrers can read own referrals"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

-- Referral rows are created by the auth signup trigger, not client sessions.
-- NOTE: referral attribution + code minting live in
-- sql/add_profiles_email_sync_trigger.sql (runs after this file).
CREATE POLICY "Service role full access on referrals"
  ON public.referrals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3) Referral payments table — one row per payout event (never update, only insert)
CREATE TABLE IF NOT EXISTS public.referral_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  payout_to uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- amount in kobo (smallest NGN unit)
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'paid'
  source_reference text, -- e.g., Paystack reference or slot credit id
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

-- Index for fast payout lookups
CREATE INDEX IF NOT EXISTS referral_payments_payout_to_idx ON public.referral_payments(payout_to);
CREATE INDEX IF NOT EXISTS referral_payments_status_idx ON public.referral_payments(status);
CREATE INDEX IF NOT EXISTS referral_payments_referral_id_idx ON public.referral_payments(referral_id);
CREATE UNIQUE INDEX IF NOT EXISTS referral_payments_source_reference_unique
  ON public.referral_payments(source_reference)
  WHERE source_reference IS NOT NULL;

-- Enable RLS
ALTER TABLE public.referral_payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own referral payments
CREATE POLICY "Users can read own referral payments"
  ON public.referral_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = payout_to);

-- Only the payment worker can create or update payment records.
CREATE POLICY "Service role full access on referral payments"
  ON public.referral_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);