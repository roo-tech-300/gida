-- Migration: Referral withdrawal requests + bank details on profiles
-- Run after: 20261016_referral_integrity.sql

-- 1) Bank details on profiles (for referral payouts)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_bank_name        text,
  ADD COLUMN IF NOT EXISTS payout_account_number   text,
  ADD COLUMN IF NOT EXISTS payout_account_name     text;

-- 2) Withdrawal requests table
CREATE TABLE IF NOT EXISTS public.referral_withdrawal_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount         integer     NOT NULL CHECK (amount > 0),  -- verified server-side, extra guard
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'paid', 'rejected')),
  bank_name      text        NOT NULL CHECK (length(trim(bank_name)) > 0),
  account_number text        NOT NULL CHECK (length(trim(account_number)) > 0),
  account_name   text        NOT NULL CHECK (length(trim(account_name)) > 0),
  admin_note     text,
  requested_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz
);

CREATE INDEX IF NOT EXISTS rwr_user_id_idx    ON public.referral_withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS rwr_status_idx     ON public.referral_withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS rwr_requested_idx  ON public.referral_withdrawal_requests(requested_at DESC);

-- SECURITY: one pending request per user at a time — blocks duplicate requests
-- even if someone bypasses the app and hits Supabase directly.
CREATE UNIQUE INDEX IF NOT EXISTS rwr_one_pending_per_user
  ON public.referral_withdrawal_requests(user_id)
  WHERE status = 'pending';

ALTER TABLE public.referral_withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own requests
CREATE POLICY "Users can read own withdrawal requests"
  ON public.referral_withdrawal_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Insert via the secure RPC only — direct INSERT from clients is blocked.
-- The request_withdrawal RPC validates the amount server-side.
CREATE POLICY "Service role full access on withdrawal requests"
  ON public.referral_withdrawal_requests
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT ALL ON public.referral_withdrawal_requests TO service_role;
-- Authenticated users have NO direct INSERT — they must go through the RPC.
GRANT SELECT ON public.referral_withdrawal_requests TO authenticated;

-- 3) RPC: request_withdrawal
--    Called by the authenticated user. Calculates the real pending amount
--    from referral_payments (ignores client-supplied amount to prevent inflation),
--    then inserts the withdrawal request atomically.
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_bank_name      text,
  p_account_number text,
  p_account_name   text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        uuid := auth.uid();
  v_pending_amount integer;
  v_request_id     uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate inputs
  IF trim(p_bank_name) = '' OR trim(p_account_number) = '' OR trim(p_account_name) = '' THEN
    RAISE EXCEPTION 'Bank details are required';
  END IF;

  -- Block if there is already a pending request (belt-and-suspenders with the unique index)
  IF EXISTS (
    SELECT 1 FROM public.referral_withdrawal_requests
    WHERE user_id = v_user_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a pending withdrawal request';
  END IF;

  -- Calculate real pending amount from referral_payments — never trust the client
  SELECT COALESCE(SUM(amount), 0)
  INTO v_pending_amount
  FROM public.referral_payments
  WHERE payout_to = v_user_id
    AND status    = 'pending';

  IF v_pending_amount <= 0 THEN
    RAISE EXCEPTION 'No pending earnings available to withdraw';
  END IF;

  INSERT INTO public.referral_withdrawal_requests (
    user_id, amount, bank_name, account_number, account_name, status
  ) VALUES (
    v_user_id, v_pending_amount, trim(p_bank_name), trim(p_account_number), trim(p_account_name), 'pending'
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

-- Only authenticated users (themselves) can call this
GRANT EXECUTE ON FUNCTION public.request_withdrawal(text, text, text) TO authenticated;

-- 4) RPC: disburse_withdrawal(request_id)
--    Called by super admin ONLY (service_role). Atomically marks the withdrawal
--    request paid and flips all pending referral_payments for that user to paid.
CREATE OR REPLACE FUNCTION public.disburse_withdrawal(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Verify request exists and is still pending
  SELECT user_id INTO v_user_id
  FROM public.referral_withdrawal_requests
  WHERE id = p_request_id AND status = 'pending'
  FOR UPDATE; -- lock the row to prevent concurrent double-disburse

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found or already resolved';
  END IF;

  -- Mark all pending referral_payments for this user as paid
  UPDATE public.referral_payments
  SET status  = 'paid',
      paid_at = now()
  WHERE payout_to = v_user_id
    AND status    = 'pending';

  -- Mark the withdrawal request as paid
  UPDATE public.referral_withdrawal_requests
  SET status      = 'paid',
      resolved_at = now()
  WHERE id = p_request_id;
END;
$$;

-- SECURITY: only service_role can disburse — regular users cannot call this
GRANT EXECUTE ON FUNCTION public.disburse_withdrawal(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.disburse_withdrawal(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.disburse_withdrawal(uuid) FROM authenticated;
