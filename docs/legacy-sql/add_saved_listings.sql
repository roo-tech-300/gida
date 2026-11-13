-- saved_listings: lets a user save (heart) listings to revisit later.
-- The app's save/unsave services + the Saved tab depend on this table.
-- NOTE: The table, its composite PK (user_id, listing_id), FKs, and index
-- already exist in production. This script only ensures row-level security so
-- the app's Supabase service calls (which use auth.uid()) actually work.

CREATE TABLE IF NOT EXISTS public.saved_listings (
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_listings_pkey PRIMARY KEY (user_id, listing_id),
  CONSTRAINT saved_listings_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT saved_listings_listing_id_fkey FOREIGN KEY (listing_id)
    REFERENCES public.listings (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saved_listings_count
  ON public.saved_listings (listing_id);

ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved listings" ON public.saved_listings;
CREATE POLICY "Users can view their own saved listings"
  ON public.saved_listings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save listings" ON public.saved_listings;
CREATE POLICY "Users can save listings"
  ON public.saved_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own saved listings" ON public.saved_listings;
CREATE POLICY "Users can remove their own saved listings"
  ON public.saved_listings FOR DELETE
  USING (auth.uid() = user_id);
