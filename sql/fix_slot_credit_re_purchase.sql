-- Migration: harden the slot-credit payment/expiry flow against production data risks.
-- Run in Supabase (SQL editor). Applies to both the app (authenticated) and the worker (service_role).
-- Safe to re-run (DROP IF EXISTS / CREATE OR REPLACE / DROP + recreate index).
--
-- REQUIRED ORDER — run in TWO separate script executions:
--   1) Run sql/add_payment_flow.sql FIRST (adds the 'expired' enum value + paid_at column).
--      `ALTER TYPE ... ADD VALUE` cannot be followed by a use of the new value in the same
--      transaction, so it must be its own script.
--   2) Then run THIS file.

-- Guard: abort with a clear message if the prerequisite enum value is missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'slot_credit_status' AND e.enumlabel = 'expired'
  ) THEN
    RAISE EXCEPTION 'Prerequisite missing: enum value "expired" does not exist. Run sql/add_payment_flow.sql first (as its own script).';
  END IF;
END $$;

-- R1) Re-purchase after expiry: exclude expired rows from the (user, listing) unique key.
--     The app's dedupe allows a fresh purchase once the old credit is 'expired'; without this
--     the expired row still blocks the new insert under the unique index (breaks in production).
DROP INDEX IF EXISTS public.slot_credits_user_listing_key;
CREATE UNIQUE INDEX slot_credits_user_listing_key
  ON public.slot_credits (user_id, listing_id)
  WHERE status <> 'expired';

-- R2) Payments/expiry persist for real users: slot_credits has SELECT/INSERT RLS but no UPDATE
--     policy, so markSlotCreditPaid / expireSlotCredit updates are silently rejected.
DROP POLICY IF EXISTS "slot_credits_update_own" ON public.slot_credits;
CREATE POLICY "slot_credits_update_own" ON public.slot_credits
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- R4) Pod updates scoped to members. Founders and joiners both become pod_members rows before any
--     pod UPDATE (join flow inserts the member, then bumps current_total_intent).
DROP POLICY IF EXISTS "pods_update_authenticated" ON public.pods;
CREATE POLICY "pods_update_authenticated" ON public.pods
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pod_members pm WHERE pm.pod_id = pods.id AND pm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pod_members pm WHERE pm.pod_id = pods.id AND pm.user_id = auth.uid()));

-- R3) Reconcile pod occupancy when a member's credit expires: recompute current_total_intent and
--     is_finalized from the pod's non-expired members. Called by the app after expireSlotCredit
--     and by the worker after its expiry sweep. SECURITY DEFINER so service_role can run it;
--     authenticated callers may only reconcile pods they belong to (own credit).
CREATE OR REPLACE FUNCTION public.reconcile_pod_after_credit_expiry(p_slot_credit_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pod_id UUID;
  v_active INTEGER;
  v_target INTEGER;
BEGIN
  SELECT pm.pod_id INTO v_pod_id
  FROM public.pod_members pm
  WHERE pm.slot_credit_id = p_slot_credit_id
    AND (pm.user_id = auth.uid() OR auth.uid() IS NULL)
  LIMIT 1;

  IF v_pod_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(pm.intent_size), 0)
  INTO v_active
  FROM public.pod_members pm
  JOIN public.slot_credits sc ON sc.id = pm.slot_credit_id
  WHERE pm.pod_id = v_pod_id
    AND sc.status <> 'expired';

  SELECT COALESCE(p.target_occupancy, p.property_tier)
  INTO v_target
  FROM public.pods p
  WHERE p.id = v_pod_id;

  UPDATE public.pods
  SET current_total_intent = v_active,
      is_finalized = v_active >= COALESCE(v_target, property_tier)
  WHERE id = v_pod_id;

  RETURN v_pod_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_pod_after_credit_expiry(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_pod_after_credit_expiry(UUID) TO authenticated, service_role;
