-- Migration: paid guided tours ("assisted tour", ₦2,000) with 4-person slots
-- Run this in Supabase (SQL editor) BEFORE redeploying the worker.
--
-- Flow: user confirms a slot -> reserve_tour() capacity-checks atomically and
-- inserts a row as 'pending_payment' -> user pays ₦2,000 via Paystack -> the
-- worker flips the row to 'booked' on payment success. The slot is held for
-- the payer (capacity counts pending + booked seats).

-- 1) The tour booking row. UNIQUE(user_id, listing_id, date, time) stops a
--    user double-confirming the same slot.
CREATE TABLE IF NOT EXISTS public.tour_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, listing_id, scheduled_date, scheduled_time)
);

-- 2) Fast availability lookups: "how many people booked this slot?"
CREATE INDEX IF NOT EXISTS tour_bookings_availability_idx
  ON public.tour_bookings (listing_id, scheduled_date, scheduled_time, status);

-- 3) RLS: users read only their own bookings. Writes go through reserve_tour()
--    and the worker (service-role key), which both bypass RLS.
ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tour_bookings_select_own ON public.tour_bookings;
CREATE POLICY tour_bookings_select_own
  ON public.tour_bookings
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4) Reserve a slot for the current user. Enforces the 4-person cap atomically
--    (advisory lock on the slot key) and inserts as 'pending_payment'.
--    Raises 'slot_full' when the slot is already at capacity, and
--    'already_booked' when the user already holds an active tour on this
--    listing (a user may only book one tour per property at a time).
CREATE OR REPLACE FUNCTION public.reserve_tour(
  p_listing_id uuid,
  p_admin_id uuid,
  p_scheduled_date date,
  p_scheduled_time text
) RETURNS public.tour_bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_slot_key text := p_listing_id::text || '|' || p_scheduled_date::text || '|' || p_scheduled_time;
  v_count int;
  v_row public.tour_bookings;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_slot_key, 0));

  SELECT count(*) INTO v_count
  FROM public.tour_bookings
  WHERE listing_id = p_listing_id
    AND user_id = v_user_id
    AND status NOT IN ('cancelled', 'expired');

  IF v_count > 0 THEN
    RAISE EXCEPTION 'already_booked';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.tour_bookings
  WHERE listing_id = p_listing_id
    AND scheduled_date = p_scheduled_date
    AND scheduled_time = p_scheduled_time
    AND status NOT IN ('cancelled', 'expired');

  IF v_count >= 4 THEN
    RAISE EXCEPTION 'slot_full';
  END IF;

  INSERT INTO public.tour_bookings (user_id, listing_id, admin_id, scheduled_date, scheduled_time)
  VALUES (v_user_id, p_listing_id, p_admin_id, p_scheduled_date, p_scheduled_time)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_tour(uuid, uuid, date, text) TO authenticated;

-- 5) Capacity counts for the picker UI. Returns how many people are already
--    booked per slot for a listing (no user data — just counts).
CREATE OR REPLACE FUNCTION public.get_tour_availability(p_listing_id uuid)
RETURNS TABLE(scheduled_date date, scheduled_time text, booked bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.scheduled_date, t.scheduled_time, count(*) AS booked
  FROM public.tour_bookings t
  WHERE t.listing_id = p_listing_id
    AND t.status NOT IN ('cancelled', 'expired')
  GROUP BY t.scheduled_date, t.scheduled_time;
$$;

GRANT EXECUTE ON FUNCTION public.get_tour_availability(uuid) TO authenticated;
