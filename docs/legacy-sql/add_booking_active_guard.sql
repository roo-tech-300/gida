-- Migration: backend-enforced "one active booking per user per listing".
-- Run in Supabase (SQL editor). Safe to re-run (DROP IF EXISTS / CREATE OR REPLACE).
--
-- Rule: a user may only hold ONE non-expired slot_credit per listing.
--   * Clicking book with an active (non-expired) booking -> rejected with a
--     friendly 'already have an active reservation' error.
--   * Expired bookings never block a new one (status = 'expired' is exempt).
--
-- Two layers of enforcement:
--   A) BEFORE INSERT trigger: friendly, race-safe rejection on every insert
--      path (app, worker, RPCs). Backstopped by the partial unique index
--      slot_credits_user_listing_key (WHERE status <> 'expired') from
--      sql/fix_slot_credit_re_purchase.sql.
--   B) has_active_booking(p_listing_id) RPC: lets the app check at button
--      press before attempting the insert (fast fail + clear UX).

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

-- A) BEFORE INSERT trigger: reject a new non-expired credit while an active one exists.
CREATE OR REPLACE FUNCTION public.enforce_single_active_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Expired credits are always allowed (rebooking after expiry must work).
  IF NEW.status = 'expired' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.slot_credits sc
    WHERE sc.user_id = NEW.user_id
      AND sc.listing_id = NEW.listing_id
      AND sc.status <> 'expired'
  ) THEN
    RAISE EXCEPTION 'You already have an active reservation for this property.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_active_booking ON public.slot_credits;
CREATE TRIGGER trg_enforce_single_active_booking
  BEFORE INSERT ON public.slot_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_active_booking();

-- B) Button-press pre-check: returns the caller's active (non-expired)
--    credit id for the listing, or NULL when booking is allowed.
CREATE OR REPLACE FUNCTION public.has_active_booking(p_listing_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sc.id
  FROM public.slot_credits sc
  WHERE sc.user_id = auth.uid()
    AND sc.listing_id = p_listing_id
    AND sc.status <> 'expired'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.has_active_booking(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_booking(uuid) TO authenticated, service_role;