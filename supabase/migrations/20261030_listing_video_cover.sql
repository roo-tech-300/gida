-- ---------------------------------------------------------------------------
-- Per-listing choice: use the walkthrough video's 8s preview as the feed
-- cover, or keep the photo.
--
-- Requires 20261027_listing_videos.sql. Apply BEFORE shipping the app build
-- that writes video_cover_enabled, or creating/saving listings fails.
--
-- The feed reads listings.video_preview_path (copied from the first ready
-- video by sync_listing_video_preview). That copy is now NULL when the admin
-- turned the video cover off, so the feed and get_recommended_listings need
-- no changes. The property page's video tour is unaffected.
-- ---------------------------------------------------------------------------

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS video_cover_enabled boolean NOT NULL DEFAULT true;

-- The first ready video's preview, or NULL when there is none or the listing
-- has the video cover turned off.
CREATE OR REPLACE FUNCTION listing_cover_preview_path(p_listing_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lv.preview_path
  FROM public.listing_videos lv
  JOIN public.listings l ON l.id = lv.listing_id
  WHERE lv.listing_id = p_listing_id
    AND lv.status = 'ready'
    AND l.video_cover_enabled
  ORDER BY lv.display_order, lv.created_at
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION sync_listing_video_preview()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_id uuid;
  v_preview text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_listing_id := OLD.listing_id;
  ELSE
    v_listing_id := NEW.listing_id;
  END IF;

  v_preview := listing_cover_preview_path(v_listing_id);

  -- No-op when the listing itself is being deleted (cascade) or nothing changed.
  UPDATE public.listings
  SET video_preview_path = v_preview
  WHERE id = v_listing_id
    AND video_preview_path IS DISTINCT FROM v_preview;

  RETURN NULL;
END;
$$;

-- Toggling the cover recomputes the copy on the same row (BEFORE trigger, so
-- no second UPDATE and no recursion).
CREATE OR REPLACE FUNCTION sync_listing_video_cover()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.video_cover_enabled THEN
    SELECT lv.preview_path INTO NEW.video_preview_path
    FROM public.listing_videos lv
    WHERE lv.listing_id = NEW.id AND lv.status = 'ready'
    ORDER BY lv.display_order, lv.created_at
    LIMIT 1;
  ELSE
    NEW.video_preview_path := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listings_sync_video_cover ON public.listings;
CREATE TRIGGER trg_listings_sync_video_cover
BEFORE UPDATE OF video_cover_enabled ON public.listings
FOR EACH ROW
WHEN (OLD.video_cover_enabled IS DISTINCT FROM NEW.video_cover_enabled)
EXECUTE FUNCTION sync_listing_video_cover();
