-- Keep video listings out of customer access until every expected video is playable.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS video_expected_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_video_expected_count_nonnegative;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_video_expected_count_nonnegative
  CHECK (video_expected_count >= 0);
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.reconcile_listing_video_publication(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected integer;
  v_total integer;
  v_ready integer;
  v_published boolean;
BEGIN
  SELECT video_expected_count INTO v_expected
  FROM public.listings WHERE id = p_listing_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT count(*), count(*) FILTER (
    WHERE status = 'ready'
      AND hls_path IS NOT NULL
      AND poster_path IS NOT NULL
      AND preview_path IS NOT NULL
  ) INTO v_total, v_ready
  FROM public.listing_videos WHERE listing_id = p_listing_id;

  v_published := v_expected = 0 OR (v_total = v_expected AND v_ready = v_expected);
  UPDATE public.listings SET published = v_published
  WHERE id = p_listing_id AND published IS DISTINCT FROM v_published;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_listing_video_publication()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_total integer;
  v_ready integer;
BEGIN
  IF NEW.video_expected_count = 0 THEN
    NEW.published := true;
    RETURN NEW;
  END IF;

  SELECT count(*), count(*) FILTER (
    WHERE status = 'ready'
      AND hls_path IS NOT NULL
      AND poster_path IS NOT NULL
      AND preview_path IS NOT NULL
  ) INTO v_total, v_ready
  FROM public.listing_videos WHERE listing_id = NEW.id;

  NEW.published := v_total = NEW.video_expected_count AND v_ready = NEW.video_expected_count;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listings_guard_video_publication_insert ON public.listings;
CREATE TRIGGER trg_listings_guard_video_publication_insert
BEFORE INSERT ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.guard_listing_video_publication();

DROP TRIGGER IF EXISTS trg_listings_guard_video_publication_update ON public.listings;
CREATE TRIGGER trg_listings_guard_video_publication_update
BEFORE UPDATE OF published, video_expected_count ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.guard_listing_video_publication();

CREATE OR REPLACE FUNCTION public.reconcile_listing_after_video_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.reconcile_listing_video_publication(OLD.listing_id);
    RETURN OLD;
  END IF;
  PERFORM public.reconcile_listing_video_publication(NEW.listing_id);
  IF TG_OP = 'UPDATE' AND OLD.listing_id IS DISTINCT FROM NEW.listing_id THEN
    PERFORM public.reconcile_listing_video_publication(OLD.listing_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listing_videos_reconcile_publication ON public.listing_videos;
CREATE TRIGGER trg_listing_videos_reconcile_publication
AFTER INSERT OR UPDATE OR DELETE
ON public.listing_videos
FOR EACH ROW EXECUTE FUNCTION public.reconcile_listing_after_video_change();

-- This restrictive policy also constrains any existing broad SELECT or ALL policies.
DROP POLICY IF EXISTS listings_select_published_or_admin ON public.listings;
CREATE POLICY listings_select_published_or_admin ON public.listings
FOR SELECT TO anon, authenticated
USING (
  published
  OR (
    auth.uid() IS NOT NULL
    AND (admin_id = auth.uid() OR public.can_manage_listing(region_path))
  )
);
DROP POLICY IF EXISTS listings_published_read_guard ON public.listings;
CREATE POLICY listings_published_read_guard ON public.listings
AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (
  published
  OR (
    auth.uid() IS NOT NULL
    AND (admin_id = auth.uid() OR public.can_manage_listing(region_path))
  )
);

-- Photos and videos belonging to drafts must not be discoverable through their own tables.
DROP POLICY IF EXISTS listing_photos_select_published_or_admin ON public.listing_photos;
CREATE POLICY listing_photos_select_published_or_admin ON public.listing_photos
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_photos.listing_id
      AND (l.published OR (auth.uid() IS NOT NULL AND (l.admin_id = auth.uid() OR public.can_manage_listing(l.region_path))))
  )
);
DROP POLICY IF EXISTS listing_photos_published_read_guard ON public.listing_photos;
CREATE POLICY listing_photos_published_read_guard ON public.listing_photos
AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_photos.listing_id
      AND (l.published OR (auth.uid() IS NOT NULL AND (l.admin_id = auth.uid() OR public.can_manage_listing(l.region_path))))
  )
);
DROP POLICY IF EXISTS listing_photos_manage_by_listing_admin ON public.listing_photos;
CREATE POLICY listing_photos_manage_by_listing_admin ON public.listing_photos
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_photos.listing_id
      AND (l.admin_id = auth.uid() OR public.can_manage_listing(l.region_path))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_photos.listing_id
      AND (l.admin_id = auth.uid() OR public.can_manage_listing(l.region_path))
  )
);

DROP POLICY IF EXISTS "Anyone can view ready listing videos" ON public.listing_videos;
DROP POLICY IF EXISTS listing_videos_select_published_or_admin ON public.listing_videos;
CREATE POLICY listing_videos_select_published_or_admin ON public.listing_videos
FOR SELECT TO anon, authenticated
USING (
  (status = 'ready' AND EXISTS (
    SELECT 1 FROM public.listings l WHERE l.id = listing_videos.listing_id AND l.published
  ))
  OR EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_videos.listing_id
      AND auth.uid() IS NOT NULL
      AND (l.admin_id = auth.uid() OR public.can_manage_listing(l.region_path))
  )
);
DROP POLICY IF EXISTS listing_videos_published_read_guard ON public.listing_videos;
CREATE POLICY listing_videos_published_read_guard ON public.listing_videos
AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (
  (status = 'ready' AND EXISTS (
    SELECT 1 FROM public.listings l WHERE l.id = listing_videos.listing_id AND l.published
  ))
  OR EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_videos.listing_id
      AND auth.uid() IS NOT NULL
      AND (l.admin_id = auth.uid() OR public.can_manage_listing(l.region_path))
  )
);

-- The recommendation RPC is defined in the hosted database, not this repository.
-- Run it as the caller so listings RLS also applies to home feed results.
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_recommended_listings' AND p.prokind = 'f'
  LOOP
    EXECUTE format('ALTER FUNCTION %s SECURITY INVOKER', f.signature);
  END LOOP;
END;
$$;
