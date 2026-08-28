-- ---------------------------------------------------------------------------
-- Tour bookings: admin visibility, admin status updates, and realtime alerts.
-- Run this AFTER add_tour_bookings.sql (needs tour_bookings + listings).
--
-- Self-contained: defines can_manage_listing(uuid[]) so it does not depend on
-- admin_hierarchy_region_paths.sql having been applied. Both files use the
-- identical CREATE OR REPLACE definition, so running either is safe.
-- ---------------------------------------------------------------------------

-- 0) Hierarchy check used below: super admins manage everything; regional
--    admins manage listings whose region_path contains their assigned region.
CREATE OR REPLACE FUNCTION can_manage_listing(p_region_path uuid[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = auth.uid() AND ap.role = 'super_admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = auth.uid()
        AND ap.role = 'regional_admin'
        AND ap.assigned_region_id = ANY(p_region_path)
    );
$$;

-- 1) Realtime: deliver INSERT events to subscribed admins who can see the row
--    (realtime respects the SELECT policy added below).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tour_bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tour_bookings;
  END IF;
END $$;

-- 2) SELECT: admins can see tours for listings they own or can manage.
--    - field admin owns the listing (listings.admin_id = auth.uid())
--    - regional/super admins manage via region path (can_manage_listing)
DROP POLICY IF EXISTS "tour_bookings_select_admins" ON public.tour_bookings;
CREATE POLICY "tour_bookings_select_admins" ON public.tour_bookings
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = tour_bookings.listing_id
      AND (l.admin_id = auth.uid() OR can_manage_listing(l.region_path))
  )
);

-- 3) UPDATE: admins may move their tours through statuses (e.g. booked -> completed).
DROP POLICY IF EXISTS "tour_bookings_update_admins" ON public.tour_bookings;
CREATE POLICY "tour_bookings_update_admins" ON public.tour_bookings
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = tour_bookings.listing_id
      AND (l.admin_id = auth.uid() OR can_manage_listing(l.region_path))
  )
)
WITH CHECK (status IN ('pending_payment', 'booked', 'completed', 'cancelled', 'expired'));

-- 4) Listing metadata (title, landmark, image) must be readable by any
--    authenticated user — students and admins — so tour embeds and admin
--    detail pages always resolve, even if the admin hierarchy migration has
--    not been applied. Idempotent.
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings_select_authenticated" ON public.listings;
CREATE POLICY "listings_select_authenticated" ON public.listings
FOR SELECT TO authenticated
USING (true);
