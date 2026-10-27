-- =============================================================================
-- Migration: Add trigger to recalculate place ratings
-- =============================================================================
-- Ensures places.rating and places.rating_count are always updated
-- atomically when place_ratings change, regardless of RLS.

-- Function to recalculate ratings for a place
CREATE OR REPLACE FUNCTION public.update_place_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_place_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_place_id := OLD.place_id;
  ELSE
    target_place_id := NEW.place_id;
  END IF;

  UPDATE public.places
  SET
    rating = COALESCE((
      SELECT AVG(rating)::numeric(3,2)
      FROM public.place_ratings
      WHERE place_id = target_place_id
    ), 0.00),
    rating_count = COALESCE((
      SELECT COUNT(*)
      FROM public.place_ratings
      WHERE place_id = target_place_id
    ), 0)
  WHERE id = target_place_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_update_place_rating ON public.place_ratings;

CREATE TRIGGER trg_update_place_rating
AFTER INSERT OR UPDATE OR DELETE ON public.place_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_place_rating();
-- =============================================================================
-- End of migration
-- =============================================================================
