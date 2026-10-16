-- Migration: sync auth.users.email to public.profiles.email on user creation
-- Run order: AFTER add_liquidity_pool_schema.sql and add_referral_system.sql

-- Helper: upsert profile from auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_code text;
  v_referrer_id uuid;
  v_new_code text;
  v_attempts int := 0;
BEGIN
  -- Mint a long, case-sensitive alphanumeric referral code (UUID-style,
  -- ~62^24 combinations). Column collation on referral_code must be
  -- case-sensitive ("C") for the uniqueness check to hold.
  LOOP
    v_new_code := substring(md5(gen_random_uuid()::text || gen_random_uuid()::text) from 1 for 12)
      || substring(sha256(gen_random_uuid()::text::bytea)::text from 1 for 12);
    -- Map hex-only output into the full alphanumeric alphabet for density.
    v_new_code := translate(v_new_code,
      '0123456789abcdef',
      'G7xQ9vK2mZpL4sA8');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_new_code);
    v_attempts := v_attempts + 1;
    IF v_attempts >= 10 THEN
      v_new_code := NULL;
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.profiles (id, email, full_name, referral_code, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    v_new_code,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        referral_code = COALESCE(profiles.referral_code, EXCLUDED.referral_code);

  v_referral_code := NULLIF(trim(NEW.raw_user_meta_data->>'referral_code'), '');
  IF v_referral_code IS NOT NULL THEN
    -- Case-sensitive match: codes are UUID-style and case matters.
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = v_referral_code
      AND id <> NEW.id
    LIMIT 1;

    IF v_referrer_id IS NOT NULL THEN
      INSERT INTO public.referrals (referrer_id, referred_id, referral_code)
      SELECT v_referrer_id, NEW.id, referral_code
      FROM public.profiles
      WHERE id = v_referrer_id
      ON CONFLICT (referred_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger: fire after auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Optional: also sync on email update
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_update ON auth.users;

CREATE TRIGGER on_auth_user_email_update
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_update();

-- Backfill existing users (run once)
INSERT INTO public.profiles (id, email, created_at)
SELECT id, email, created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email
WHERE profiles.email IS DISTINCT FROM EXCLUDED.email;