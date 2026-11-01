-- ---------------------------------------------------------------------------
-- Choose which video is the listing's cover.
--
-- The feed uses the first ready video (by display_order) as its video cover.
-- The wizard's cover picker can therefore make any existing video the cover by
-- moving it to the front; the sync_listing_video_preview trigger then copies
-- its preview onto listings.video_preview_path.
--
-- Writes to listing_videos stay server-side (service role), so this runs as a
-- SECURITY DEFINER function that only changes display_order and checks that
-- the caller manages the listing.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_listing_hero_video(p_listing_id uuid, p_video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = p_listing_id
      AND (l.admin_id = auth.uid() OR public.can_manage_listing(l.region_path))
  ) THEN
    RAISE EXCEPTION 'You cannot manage this listing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.listing_videos lv
    WHERE lv.id = p_video_id
      AND lv.listing_id = p_listing_id
  ) THEN
    RAISE EXCEPTION 'That video does not belong to this listing';
  END IF;

  -- Renumber 0..n-1 with the chosen video first. Only changed rows are
  -- touched, so repeat saves are a no-op and the preview trigger only fires
  -- when the order actually moves.
  WITH ranked AS (
    SELECT
      id,
      row_number() OVER (
        ORDER BY (id = p_video_id) DESC, display_order, created_at
      ) - 1 AS new_order
    FROM public.listing_videos
    WHERE listing_id = p_listing_id
  )
  UPDATE public.listing_videos lv
  SET display_order = ranked.new_order
  FROM ranked
  WHERE lv.id = ranked.id
    AND lv.display_order IS DISTINCT FROM ranked.new_order;
END;
$$;

REVOKE ALL ON FUNCTION public.set_listing_hero_video(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_listing_hero_video(uuid, uuid) TO authenticated;
