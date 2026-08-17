-- Standalone reviews table for Gida.
-- This script only creates the reviews table and its related policies/indexes.
-- It assumes you already have auth.users available from Supabase Auth.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  review_number INTEGER NOT NULL CHECK (review_number >= 1 AND review_number <= 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reviews_user_listing_review_number_key UNIQUE (listing_id, user_id, review_number)
);

CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON public.reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_slot_id ON public.reviews(slot_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_review_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  review_count INTEGER;
BEGIN
  IF NEW.review_number IS NULL THEN
    SELECT COUNT(*)
      INTO review_count
    FROM public.reviews
    WHERE listing_id = NEW.listing_id
      AND user_id = NEW.user_id;

    NEW.review_number := review_count + 1;
  END IF;

  IF NEW.review_number < 1 OR NEW.review_number > 3 THEN
    RAISE EXCEPTION 'review_number must be between 1 and 3.';
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*)
      INTO review_count
    FROM public.reviews
    WHERE listing_id = NEW.listing_id
      AND user_id = NEW.user_id;

    IF review_count >= 3 THEN
      RAISE EXCEPTION 'A user may only create up to 3 reviews per listing.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_rules ON public.reviews;
CREATE TRIGGER trg_reviews_rules
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.enforce_review_rules();

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reviews are viewable by anyone" ON public.reviews;
CREATE POLICY "Public reviews are viewable by anyone"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
CREATE POLICY "Users can create their own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);
