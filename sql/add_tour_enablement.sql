-- Migration: per-listing tour enablement (self-guided / guided).
-- Run this in the Supabase SQL editor.
--
-- 1) The two flags. DEFAULT true keeps existing listings tourable.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS enable_self_guided_tour boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_guided_tour boolean NOT NULL DEFAULT true;

-- 2) Enforce enablement + location inside the RPC so clients cannot bypass it.
--    Same signature as sql/add_tour_bookings.sql; adds:
--      'listing_not_found' - no such listing,
--      'no_location'       - listing has no mapped coordinates,
--      'tours_disabled'    - guided tours turned off for this listing.
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
  v_latitude numeric;
  v_longitude numeric;
  v_guided_enabled boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT latitude, longitude, enable_guided_tour
    INTO v_latitude, v_longitude, v_guided_enabled
  FROM public.listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  IF v_latitude IS NULL OR v_longitude IS NULL THEN
    RAISE EXCEPTION 'no_location';
  END IF;

  -- This RPC books a guided (admin-accompanied) tour.
  IF NOT COALESCE(v_guided_enabled, true) THEN
    RAISE EXCEPTION 'tours_disabled';
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

  IF p_admin_id IS NOT NULL THEN
    SELECT count(*) INTO v_count
    FROM public.tour_bookings
    WHERE admin_id = p_admin_id
      AND listing_id != p_listing_id
      AND scheduled_date = p_scheduled_date
      AND scheduled_time = p_scheduled_time
      AND status NOT IN ('cancelled', 'expired');
    IF v_count > 0 THEN
      RAISE EXCEPTION 'admin_unavailable';
    END IF;
  END IF;

  INSERT INTO public.tour_bookings (user_id, listing_id, admin_id, scheduled_date, scheduled_time)
  VALUES (v_user_id, p_listing_id, p_admin_id, p_scheduled_date, p_scheduled_time)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_tour(uuid, uuid, date, text) TO authenticated;