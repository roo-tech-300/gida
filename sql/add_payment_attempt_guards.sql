-- Prevent duplicate lodge, guided-tour, and location-access payments.
-- Run this migration before deploying the updated Worker.

CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_kind TEXT NOT NULL CHECK (purchase_kind IN ('lodge', 'tour', 'location')),
  purchase_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,
  authorization_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('initializing', 'pending', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (purchase_kind, purchase_id)
);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_attempts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.payment_attempts TO service_role;

CREATE OR REPLACE FUNCTION public.claim_payment_attempt(
  p_purchase_kind TEXT,
  p_purchase_id UUID,
  p_user_id UUID,
  p_listing_id UUID
) RETURNS TABLE (
  decision TEXT,
  attempt_id UUID,
  reference TEXT,
  authorization_url TEXT,
  attempt_status TEXT,
  amount_ngn NUMERIC,
  is_new BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt public.payment_attempts;
  v_amount NUMERIC;
  v_status TEXT;
  v_pod_verification TEXT;
  v_reference TEXT;
BEGIN
  IF p_purchase_kind NOT IN ('lodge', 'tour', 'location') THEN
    RETURN QUERY SELECT 'invalid_purchase', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, FALSE;
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_purchase_kind || ':' || p_purchase_id::TEXT, 0));

  IF p_purchase_kind = 'lodge' THEN
    SELECT sc.amount_paid, sc.status::TEXT INTO v_amount, v_status
    FROM public.slot_credits sc
    WHERE sc.id = p_purchase_id AND sc.user_id = p_user_id AND sc.listing_id = p_listing_id;
    IF NOT FOUND THEN
      RETURN QUERY SELECT 'not_found', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, FALSE;
      RETURN;
    END IF;
    IF v_status IN ('paid_unmatched', 'matched', 'subletting') THEN
      RETURN QUERY SELECT 'already_paid', NULL::UUID, NULL::TEXT, NULL::TEXT, v_status, v_amount, FALSE;
      RETURN;
    END IF;
    SELECT p.verification_status INTO v_pod_verification
    FROM public.pod_members pm
    JOIN public.pods p ON p.id = pm.pod_id
    WHERE pm.slot_credit_id = p_purchase_id AND pm.user_id = p_user_id
    LIMIT 1;
    IF v_pod_verification IN ('pending_verification', 'rejected') THEN
      RETURN QUERY SELECT 'not_payable', NULL::UUID, NULL::TEXT, NULL::TEXT, v_pod_verification, v_amount, FALSE;
      RETURN;
    END IF;
    IF v_amount IS NULL OR v_amount <= 0 OR v_status = 'expired' THEN
      RETURN QUERY SELECT 'not_payable', NULL::UUID, NULL::TEXT, NULL::TEXT, v_status, v_amount, FALSE;
      RETURN;
    END IF;
  ELSIF p_purchase_kind = 'tour' THEN
    SELECT tb.status INTO v_status
    FROM public.tour_bookings tb
    WHERE tb.id = p_purchase_id AND tb.user_id = p_user_id AND tb.listing_id = p_listing_id;
    IF NOT FOUND THEN
      RETURN QUERY SELECT 'not_found', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, FALSE;
      RETURN;
    END IF;
    IF v_status = 'booked' THEN
      RETURN QUERY SELECT 'already_paid', NULL::UUID, NULL::TEXT, NULL::TEXT, v_status, 2000::NUMERIC, FALSE;
      RETURN;
    END IF;
    IF v_status <> 'pending_payment' THEN
      RETURN QUERY SELECT 'not_payable', NULL::UUID, NULL::TEXT, NULL::TEXT, v_status, 2000::NUMERIC, FALSE;
      RETURN;
    END IF;
    v_amount := 2000;
  ELSE
    IF EXISTS (
      SELECT 1 FROM public.location_access_payments lap
      WHERE lap.user_id = p_user_id AND lap.listing_id = p_listing_id
    ) THEN
      RETURN QUERY SELECT 'already_paid', NULL::UUID, NULL::TEXT, NULL::TEXT, 'paid', 500::NUMERIC, FALSE;
      RETURN;
    END IF;
    IF p_purchase_id <> p_listing_id THEN
      RETURN QUERY SELECT 'invalid_purchase', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, FALSE;
      RETURN;
    END IF;
    v_amount := 500;
  END IF;

  SELECT pa.* INTO v_attempt FROM public.payment_attempts pa
  WHERE pa.purchase_kind = p_purchase_kind AND pa.purchase_id = p_purchase_id
  FOR UPDATE;

  IF FOUND AND v_attempt.status = 'paid' THEN
    RETURN QUERY SELECT 'already_paid', v_attempt.id, v_attempt.reference,
      v_attempt.authorization_url, v_attempt.status, v_amount, FALSE;
    RETURN;
  END IF;

  IF FOUND AND v_attempt.status IN ('initializing', 'pending') THEN
    RETURN QUERY SELECT
      CASE WHEN v_attempt.authorization_url IS NULL THEN 'initializing' ELSE 'reuse' END,
      v_attempt.id, v_attempt.reference, v_attempt.authorization_url,
      v_attempt.status, v_amount, FALSE;
    RETURN;
  END IF;

  v_reference := 'GIDA-' || UPPER(p_purchase_kind) || '-' || REPLACE(gen_random_uuid()::TEXT, '-', '');
  IF FOUND THEN
    UPDATE public.payment_attempts pa SET
      user_id = p_user_id,
      listing_id = p_listing_id,
      reference = v_reference,
      authorization_url = NULL,
      status = 'initializing',
      created_at = NOW(),
      updated_at = NOW()
    WHERE pa.id = v_attempt.id
    RETURNING pa.* INTO v_attempt;
  ELSE
    INSERT INTO public.payment_attempts (purchase_kind, purchase_id, user_id, listing_id, reference, status)
    VALUES (p_purchase_kind, p_purchase_id, p_user_id, p_listing_id, v_reference, 'initializing')
    RETURNING * INTO v_attempt;
  END IF;

  RETURN QUERY SELECT 'new', v_attempt.id, v_attempt.reference, NULL::TEXT, v_attempt.status, v_amount, TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_payment_attempt(TEXT, UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_payment_attempt(TEXT, UUID, UUID, UUID) TO service_role;
