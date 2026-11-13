-- Migration: GPS unlock when the user has genuinely paid for the lodge.
-- Run this in Supabase (SQL editor) alongside add_tour_bookings.sql.
--
-- A user who completes a room/slot purchase (slot_credits.status =
-- 'paid_unmatched') automatically gets the listing's GPS coordinates unlocked.
-- The app inserts a location_access_payments row with method='lodge'; RLS
-- gates the insert on a real paid slot credit for that listing, so a user
-- cannot forge an unlock without paying.

ALTER TABLE public.location_access_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS location_access_payments_insert_lodge ON public.location_access_payments;
CREATE POLICY location_access_payments_insert_lodge
  ON public.location_access_payments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND method = 'lodge'
    AND EXISTS (
      SELECT 1
      FROM public.slot_credits sc
      WHERE sc.listing_id = location_access_payments.listing_id
        AND sc.user_id = auth.uid()
        AND sc.status = 'paid_unmatched'
    )
  );
