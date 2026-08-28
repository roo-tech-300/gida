-- Migration: persisted "Unlock Location & Directions" payments (Paystack)
-- Run this in Supabase (SQL editor) BEFORE redeploying the worker.
--
-- A user pays once per listing (₦500) to unlock GPS coordinates + directions.
-- The worker records the payment here (service-role key) on Paystack webhook
-- or on-demand verify. The app reads this table (RLS-scoped) to know whether
-- the listing is already unlocked — no re-payment on the next visit.

-- 1) The payment record. UNIQUE(user_id, listing_id) makes the unlock
--    idempotent: a user can never be charged for the same listing twice.
CREATE TABLE IF NOT EXISTS public.location_access_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 500,
  method TEXT NOT NULL DEFAULT 'card',
  reference TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, listing_id)
);

-- 2) Index for fast "is this listing unlocked for this user?" lookups.
CREATE INDEX IF NOT EXISTS location_access_payments_user_listing_idx
  ON public.location_access_payments (user_id, listing_id);

-- 3) RLS: users can read their own unlock records. Inserts/updates happen
--    only through the worker's service-role key (bypasses RLS).
ALTER TABLE public.location_access_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS location_access_payments_select_own ON public.location_access_payments;
CREATE POLICY location_access_payments_select_own
  ON public.location_access_payments
  FOR SELECT
  USING (auth.uid() = user_id);
