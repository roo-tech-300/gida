-- Migration: dynamic target occupancy + friend-group join for the slot system
-- Run this in Supabase (SQL editor) BEFORE relying on the DB-backed purchase/join flow.

-- 1) slot_credits: the pod size the user commits toward (divides rent/fee)
ALTER TABLE public.slot_credits ADD COLUMN IF NOT EXISTS target_occupancy INTEGER;

-- 2) pods: same target occupancy + a shareable join code for the "With Friends" flow
ALTER TABLE public.pods ADD COLUMN IF NOT EXISTS target_occupancy INTEGER;
ALTER TABLE public.pods ADD COLUMN IF NOT EXISTS group_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS pods_group_code_key ON public.pods (group_code);

-- 3) Link slot credits/pods back to the listing (estate_id still references estates(id))
ALTER TABLE public.slot_credits ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL;
ALTER TABLE public.pods ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL;

-- 4) RLS: idempotent policies for the liquidity tables (tables already have RLS ENABLED).
--    Re-running the whole file is safe (column adds use IF NOT EXISTS; policies drop-then-create).

ALTER TABLE public.estates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estates_select_authenticated" ON public.estates;
CREATE POLICY "estates_select_authenticated" ON public.estates
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "estates_insert_authenticated" ON public.estates;
CREATE POLICY "estates_insert_authenticated" ON public.estates
  FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE public.slot_credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "slot_credits_select_own" ON public.slot_credits;
CREATE POLICY "slot_credits_select_own" ON public.slot_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "slot_credits_insert_own" ON public.slot_credits;
CREATE POLICY "slot_credits_insert_own" ON public.slot_credits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.pods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pods_select_authenticated" ON public.pods;
CREATE POLICY "pods_select_authenticated" ON public.pods
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "pods_insert_authenticated" ON public.pods;
CREATE POLICY "pods_insert_authenticated" ON public.pods
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "pods_update_authenticated" ON public.pods;
CREATE POLICY "pods_update_authenticated" ON public.pods
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.pod_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pod_members_select_authenticated" ON public.pod_members;
CREATE POLICY "pod_members_select_authenticated" ON public.pod_members
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "pod_members_insert_own" ON public.pod_members;
CREATE POLICY "pod_members_insert_own" ON public.pod_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 5) Per-member billed share (floor/remainder even split) so the pod collects exactly rent + fee
ALTER TABLE public.slot_credits ADD COLUMN IF NOT EXISTS amount_paid NUMERIC;

-- 6) One active credit per user per listing (defense-in-depth; NULL listing_ids are allowed)
CREATE UNIQUE INDEX IF NOT EXISTS slot_credits_user_listing_key
  ON public.slot_credits (user_id, listing_id);
