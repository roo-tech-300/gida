-- =============================================================================
-- Migration: Add places, place photos, place ratings, and extend saved_listings
-- =============================================================================
-- Purpose:
--   1. Create public.places        — server-backed place records (Discover "Add a place")
--   2. Create public.place_photos  — one row per image attached to a place
--   3. Create public.place_ratings — one row per user per place (1–5 stars)
--   4. Alter public.saved_listings — add a `type` discriminator so the same
--      table can hold both lodge saves (existing) and place saves (new).
--      All existing rows are backfilled to type = 'lodge'.
--
-- Idempotency: Every statement is safe to re-run (IF NOT EXISTS, DROP IF EXISTS,
-- ADD COLUMN IF NOT EXISTS).
--
-- AI-agent note: Read top-to-bottom. Tables are created first, then the
-- saved_listings alteration, then RLS policies. No cross-file dependencies
-- beyond public.profiles and public.place_categories (which already exist).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0) Prerequisites: pgcrypto for gen_random_uuid()
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Helper function: set_updated_at
-- ---------------------------------------------------------------------------
-- Self-maintains `updated_at` columns on UPDATE. Used by the places trigger.
-- Idempotent: safe to re-run (CREATE OR REPLACE).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 1) public.places — core place record
-- ---------------------------------------------------------------------------
-- Mirrors the client PlaceDraft type but lives in Supabase so places can be
-- saved, rated, and photographed durably. One row = one place created by a user.
CREATE TABLE IF NOT EXISTS public.places (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by   uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         text         NOT NULL,
  category     text         NOT NULL REFERENCES public.place_categories(key) ON DELETE CASCADE,
  area         text         NOT NULL,
  address      text,                       -- optional street address (nullable)
  description  text         NOT NULL,
  latitude     numeric,                    -- nullable; populated via GPS lock or manual entry
  longitude    numeric,                    -- nullable; populated via GPS lock or manual entry
  rating       numeric(3,2) NOT NULL DEFAULT 0.00,   -- denormalized average (0–5)
  rating_count integer      NOT NULL DEFAULT 0,      -- number of ratings received
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_places_created_by ON public.places(created_by);
CREATE INDEX IF NOT EXISTS idx_places_category   ON public.places(category);
CREATE INDEX IF NOT EXISTS idx_places_created_at ON public.places(created_at DESC);

-- Updated-at trigger so `updated_at` self-maintains on every UPDATE
DROP TRIGGER IF EXISTS trg_places_updated_at ON public.places;
CREATE TRIGGER trg_places_updated_at
  BEFORE UPDATE ON public.places
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS: anyone can read places; only the creator can write/delete their own
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Places are viewable by everyone" ON public.places;
CREATE POLICY "Places are viewable by everyone"
  ON public.places FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own places" ON public.places;
CREATE POLICY "Users can insert their own places"
  ON public.places FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own places" ON public.places;
CREATE POLICY "Users can update their own places"
  ON public.places FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own places" ON public.places;
CREATE POLICY "Users can delete their own places"
  ON public.places FOR DELETE
  USING (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- 2) public.place_photos — pictures attached to a place
-- ---------------------------------------------------------------------------
-- Normalized image store: one row per image URL. sort_order controls display
-- sequence (e.g. the gallery grid in the Add Place form).
CREATE TABLE IF NOT EXISTS public.place_photos (
  id         uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id   uuid      NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  url        text      NOT NULL,
  sort_order integer   NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_place_photos_place_id ON public.place_photos(place_id);
CREATE INDEX IF NOT EXISTS idx_place_photos_sort_order ON public.place_photos(place_id, sort_order);

-- RLS: photos are public to read; only the place owner can manage them
ALTER TABLE public.place_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Place photos are viewable by everyone" ON public.place_photos;
CREATE POLICY "Place photos are viewable by everyone"
  ON public.place_photos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage photos on their own places" ON public.place_photos;
CREATE POLICY "Users can manage photos on their own places"
  ON public.place_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.places
      WHERE places.id = place_photos.place_id
        AND places.created_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3) public.place_ratings — one rating per user per place (1–5 stars)
-- ---------------------------------------------------------------------------
-- Enforced by a unique constraint on (place_id, user_id) so a user cannot
-- rate the same place twice. The `rating` column on `places` is denormalized
-- and maintained by the application layer (recompute average on insert/update).
CREATE TABLE IF NOT EXISTS public.place_ratings (
  id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id   uuid         NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id    uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating     integer      NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT place_ratings_place_user_unique UNIQUE (place_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_place_ratings_place_id ON public.place_ratings(place_id);
CREATE INDEX IF NOT EXISTS idx_place_ratings_user_id  ON public.place_ratings(user_id);

-- RLS: ratings are public to read; only the rater can write/delete their own
ALTER TABLE public.place_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Place ratings are viewable by everyone" ON public.place_ratings;
CREATE POLICY "Place ratings are viewable by everyone"
  ON public.place_ratings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage their own place ratings" ON public.place_ratings;
CREATE POLICY "Users can manage their own place ratings"
  ON public.place_ratings FOR ALL
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4) public.saved_listings — add place support (lodge + place)
-- ---------------------------------------------------------------------------
-- BEFORE: composite PK (user_id, listing_id). Every row references a lodge.
-- AFTER:  surrogate PK `id`, plus `place_id` and `type` columns.
--         type = 'lodge' → listing_id is set, place_id is null
--         type = 'place' → place_id is set, listing_id is null
-- All existing rows are backfilled to type = 'lodge'.

-- 4a) Add the new columns
ALTER TABLE public.saved_listings
  ADD COLUMN IF NOT EXISTS place_id uuid REFERENCES public.places(id) ON DELETE CASCADE;

ALTER TABLE public.saved_listings
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'lodge'
    CHECK (type IN ('place', 'lodge'));

-- 4b) Backfill: every existing saved_listings row is a lodge save
UPDATE public.saved_listings
  SET type = 'lodge'
  WHERE type IS NULL OR type = '';

-- 4c) Replace the old composite PK with a surrogate id PK
--     (listing_id must become nullable because place saves have no listing)
ALTER TABLE public.saved_listings
  DROP CONSTRAINT IF EXISTS saved_listings_pkey;

ALTER TABLE public.saved_listings
  ALTER COLUMN listing_id DROP NOT NULL;

ALTER TABLE public.saved_listings
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.saved_listings
  ADD PRIMARY KEY (id);

-- 4d) Unique index: a user cannot save the same target twice
--     COALESCE(place_id, listing_id) picks the non-null target id
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_listings_user_type_target
  ON public.saved_listings (user_id, type, COALESCE(place_id, listing_id));

-- 4e) Check constraint: type must match which id column is populated
ALTER TABLE public.saved_listings
  DROP CONSTRAINT IF EXISTS saved_listings_type_target_check;

ALTER TABLE public.saved_listings
  ADD CONSTRAINT saved_listings_type_target_check
  CHECK (
    (type = 'lodge'  AND listing_id IS NOT NULL AND place_id IS NULL)
 OR (type = 'place' AND place_id  IS NOT NULL AND listing_id IS NULL)
  );

-- Keep listing_id indexed for lodge lookups (replaces the old PK-backed index)
CREATE INDEX IF NOT EXISTS idx_saved_listings_listing_id
  ON public.saved_listings (listing_id);

-- Existing RLS policies on saved_listings (SELECT/INSERT/DELETE by user_id)
-- continue to work unchanged because user_id remains NOT NULL.

-- =============================================================================
-- End of migration
-- =============================================================================