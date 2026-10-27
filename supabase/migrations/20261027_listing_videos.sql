-- ---------------------------------------------------------------------------
-- Listing walkthrough videos.
--
-- Files live on the media server (media-server/ in this repo); this table is
-- the source of truth for which videos exist and whether they are playable.
-- Paths are relative (e.g. v/<id>/master.m3u8) and the app prefixes them with
-- EXPO_PUBLIC_MEDIA_CDN_URL, so the CDN can change without a data migration.
--
-- Only the media server (service role) writes rows: it inserts one when an
-- upload finishes and updates it as transcoding progresses.
--
-- Self-contained: defines can_manage_listing(uuid[]) with the identical
-- CREATE OR REPLACE used in sql/add_tour_admin_access.sql.
-- ---------------------------------------------------------------------------

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

CREATE TABLE IF NOT EXISTS public.listing_videos (
  id uuid PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES public.admin_profiles (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'ready', 'failed')),
  hls_path text,
  poster_path text,
  preview_path text,
  duration_seconds integer,
  width integer,
  height integer,
  display_order integer NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_videos_ready_has_paths CHECK (
    status <> 'ready' OR (hls_path IS NOT NULL AND poster_path IS NOT NULL AND preview_path IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_listing_videos_listing
  ON public.listing_videos (listing_id, display_order);

CREATE OR REPLACE FUNCTION set_listing_videos_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listing_videos_updated_at ON public.listing_videos;
CREATE TRIGGER trg_listing_videos_updated_at
BEFORE UPDATE ON public.listing_videos
FOR EACH ROW EXECUTE FUNCTION set_listing_videos_updated_at();

ALTER TABLE public.listing_videos ENABLE ROW LEVEL SECURITY;

-- Students (signed in or not) only ever see playable videos.
DROP POLICY IF EXISTS "Anyone can view ready listing videos" ON public.listing_videos;
CREATE POLICY "Anyone can view ready listing videos"
  ON public.listing_videos
  FOR SELECT
  TO anon, authenticated
  USING (status = 'ready');

-- Admins also see queued/processing/failed videos for listings they manage,
-- so the upload screen can show progress and errors.
DROP POLICY IF EXISTS "Admins can view videos of listings they manage" ON public.listing_videos;
CREATE POLICY "Admins can view videos of listings they manage"
  ON public.listing_videos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_videos.listing_id
        AND (l.admin_id = auth.uid() OR can_manage_listing(l.region_path))
    )
  );

DROP POLICY IF EXISTS "Service role full access on listing videos" ON public.listing_videos;
CREATE POLICY "Service role full access on listing videos"
  ON public.listing_videos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
