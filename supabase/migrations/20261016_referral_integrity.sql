ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_lower_uniq
  ON public.profiles (lower(referral_code))
  WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referrals_referred_id_unique UNIQUE (referred_id)
);

CREATE TABLE IF NOT EXISTS public.referral_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  payout_to uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  source_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referral_payments_payout_to_idx ON public.referral_payments(payout_to);
CREATE INDEX IF NOT EXISTS referral_payments_status_idx ON public.referral_payments(status);
CREATE INDEX IF NOT EXISTS referral_payments_referral_id_idx ON public.referral_payments(referral_id);

WITH ranked_payments AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY source_reference
           ORDER BY (status = 'paid') DESC, paid_at ASC NULLS LAST, created_at ASC, id ASC
         ) AS duplicate_rank
  FROM public.referral_payments
  WHERE source_reference IS NOT NULL
)
DELETE FROM public.referral_payments AS payments
USING ranked_payments
WHERE payments.id = ranked_payments.id
  AND ranked_payments.duplicate_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS referral_payments_source_reference_unique
  ON public.referral_payments(source_reference)
  WHERE source_reference IS NOT NULL;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read referrals" ON public.referrals;
DROP POLICY IF EXISTS "Service role can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Referrers can read own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Service role full access on referrals" ON public.referrals;

CREATE POLICY "Referrers can read own referrals"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Service role full access on referrals"
  ON public.referrals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own referral payments" ON public.referral_payments;
DROP POLICY IF EXISTS "Service role can insert referral payments" ON public.referral_payments;
DROP POLICY IF EXISTS "Service role can update referral payments" ON public.referral_payments;
DROP POLICY IF EXISTS "Service role full access on referral payments" ON public.referral_payments;

CREATE POLICY "Users can read own referral payments"
  ON public.referral_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = payout_to);

CREATE POLICY "Service role full access on referral payments"
  ON public.referral_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.referrals TO service_role;
GRANT ALL ON public.referral_payments TO service_role;

-- Backfill: mint a new-format code for every existing profile that lacks one.
DO $$
DECLARE
  r record;
  v_chars constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  v_code text;
  v_attempts int;
  i int;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE referral_code IS NULL LOOP
    v_code := NULL;
    v_attempts := 0;
    WHILE v_code IS NULL AND v_attempts < 10 LOOP
      v_code := '';
      FOR i IN 1..24 LOOP
        v_code := v_code || substr(v_chars, (floor(random() * 62) + 1)::int, 1);
      END LOOP;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_code);
      v_code := NULL;
      v_attempts := v_attempts + 1;
    END LOOP;
    IF v_code IS NOT NULL THEN
      UPDATE public.profiles SET referral_code = v_code WHERE id = r.id AND referral_code IS NULL;
    END IF;
  END LOOP;
END;
$$;

-- NOTE: the auth.users -> profiles trigger (public.handle_new_user) lives in
-- sql/add_profiles_email_sync_trigger.sql, which runs AFTER this file. Code
-- minting + referral attribution are handled there so both definitions stay
-- in one place.
