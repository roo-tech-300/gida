-- Migration: make listing GPS coordinates optional.
-- The create-listing wizard now treats location as optional, so listings may be
-- saved without locked coordinates. landlord_id and campus are already nullable
-- in the schema; latitude/longitude are the only columns blocking that flow.
-- The app's tour-booking paths already handle NULL coords ('no_location' checks
-- in tour-booking-service.ts and the SQL tour function).
--
-- Run in Supabase (SQL editor). Safe to re-run.

ALTER TABLE public.listings ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE public.listings ALTER COLUMN longitude DROP NOT NULL;
