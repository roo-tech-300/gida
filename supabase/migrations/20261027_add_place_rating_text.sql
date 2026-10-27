-- Persist the written review alongside its 1–5 star rating.
ALTER TABLE public.place_ratings
  ADD COLUMN IF NOT EXISTS text text;

-- Older ratings did not include a review body. Keep them readable as empty text.
UPDATE public.place_ratings
SET text = ''
WHERE text IS NULL;

ALTER TABLE public.place_ratings
  ALTER COLUMN text SET DEFAULT '',
  ALTER COLUMN text SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'place_ratings_text_max_length'
      AND conrelid = 'public.place_ratings'::regclass
  ) THEN
    ALTER TABLE public.place_ratings
      ADD CONSTRAINT place_ratings_text_max_length
      CHECK (char_length(text) <= 280);
  END IF;
END;
$$;
