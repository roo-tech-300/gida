-- =============================================================================
-- Migration: Add place_photos table and Supabase Storage bucket
-- =============================================================================
-- Safe to re-run in Supabase SQL Editor (idempotent statements).

-- 1) Create place_photos table if it does not already exist
CREATE TABLE IF NOT EXISTS public.place_photos (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id   uuid        NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  url        text        NOT NULL,
  sort_order integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast lookups and order sorting
CREATE INDEX IF NOT EXISTS idx_place_photos_place_id ON public.place_photos(place_id);
CREATE INDEX IF NOT EXISTS idx_place_photos_sort_order ON public.place_photos(place_id, sort_order);

-- Enable RLS on place_photos
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

-- -----------------------------------------------------------------------------
-- 2) Storage: Create the public 'place-photos' bucket
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('place-photos', 'place-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Public read access for place photos
DROP POLICY IF EXISTS "Anyone can view place photos" ON storage.objects;
CREATE POLICY "Anyone can view place photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'place-photos');

-- Storage RLS: Authenticated users can upload place photos
DROP POLICY IF EXISTS "Authenticated users can upload place photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload place photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'place-photos');

-- Storage RLS: Authenticated users can update place photos
DROP POLICY IF EXISTS "Authenticated users can update place photos" ON storage.objects;
CREATE POLICY "Authenticated users can update place photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'place-photos');

-- Storage RLS: Authenticated users can delete place photos
DROP POLICY IF EXISTS "Authenticated users can delete place photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete place photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'place-photos');
