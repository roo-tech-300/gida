-- Admin Hierarchy Region Paths
-- Keeps the region lineage (path) materialized so hierarchy-aware access checks
-- (regional admin sees all subordinates' listings) are a single array predicate.
-- Prerequisite: the columns already exist on the DB:
--   regions.path, admin_profiles.region_path, listings.region_path (uuid[]).

-- ---------------------------------------------------------------------------
-- 1. Recompute the whole region tree. Regions is small, so a full recompute is
--    simpler and always consistent.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_region_paths()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  WITH RECURSIVE tree AS (
    SELECT id, parent_region_id, ARRAY[id]::uuid[] AS path
    FROM public.regions
    WHERE parent_region_id IS NULL

    UNION ALL

    SELECT r.id, r.parent_region_id, t.path || r.id
    FROM public.regions r
    JOIN tree t ON r.parent_region_id = t.id
  )
  UPDATE public.regions rg
  SET path = tree.path
  FROM tree
  WHERE rg.id = tree.id;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Trigger: keep regions.path fresh when the tree changes.
--    Fires only when parent_region_id is actually set, so the recompute inside
--    the trigger does not re-fire itself.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_region_path()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM refresh_region_paths();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_regions_sync_path ON public.regions;
CREATE TRIGGER trg_regions_sync_path
AFTER INSERT OR UPDATE OF parent_region_id ON public.regions
FOR EACH ROW
EXECUTE FUNCTION sync_region_path();

-- Backfill current regions (idempotent).
SELECT refresh_region_paths();

-- ---------------------------------------------------------------------------
-- 3. admin_profiles.region_path mirrors the assigned region's path.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_admin_region_path()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.region_path := COALESCE(
    (SELECT r.path FROM public.regions r WHERE r.id = NEW.assigned_region_id),
    '{}'::uuid[]
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_admin_profiles_sync_region_path ON public.admin_profiles;
CREATE TRIGGER trg_admin_profiles_sync_region_path
BEFORE INSERT OR UPDATE OF assigned_region_id ON public.admin_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_admin_region_path();

-- Backfill existing admins.
UPDATE public.admin_profiles ap
SET region_path = COALESCE(
  (SELECT r.path FROM public.regions r WHERE r.id = ap.assigned_region_id),
  '{}'::uuid[]
);

-- ---------------------------------------------------------------------------
-- 4. Listing ownership lives on admin_id (FK target admin_profiles.id, which
--    itself equals profiles.id). Enforce it with the FK the app relies on.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'listings_admin_id_fkey'
  ) THEN
    ALTER TABLE public.listings
    ADD CONSTRAINT listings_admin_id_fkey
    FOREIGN KEY (admin_id)
    REFERENCES public.admin_profiles (id)
    ON DELETE RESTRICT;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. listings.region_path snapshots the owner's region path so RLS and reads
--    never need extra joins.
--
--    On INSERT the client may supply an explicit non-empty region_path (used
--    when a super admin assigns a listing to a region; a regular admin has no
--    region picker, so their listings always inherit their own region). If no
--    region_path is provided we fall back to the owner admin's region path.
--    On UPDATE OF admin_id we always re-derive from the new owner so a listing
--    follows the admin who owns it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_listing_region_path()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  admin_path uuid[];
BEGIN
  SELECT ap.region_path INTO admin_path
  FROM public.admin_profiles ap
  WHERE ap.id = NEW.admin_id;

  IF TG_OP = 'INSERT' AND NEW.region_path IS NOT NULL AND array_length(NEW.region_path, 1) > 0 THEN
    RETURN NEW;
  END IF;

  NEW.region_path := COALESCE(admin_path, '{}'::uuid[]);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_listings_sync_region_path ON public.listings;
CREATE TRIGGER trg_listings_sync_region_path
BEFORE INSERT OR UPDATE OF admin_id ON public.listings
FOR EACH ROW
EXECUTE FUNCTION sync_listing_region_path();

-- Backfill existing listings.
UPDATE public.listings l
SET region_path = COALESCE(
  (SELECT ap.region_path FROM public.admin_profiles ap WHERE ap.id = l.admin_id),
  '{}'::uuid[]
);

-- ---------------------------------------------------------------------------
-- 6. Row Level Security on listings.
--
--    SELECT stays open to authenticated users because the student feed and
--    property detail pages read listings directly; admin-scoped *views* are
--    applied in the query layer (fetchAdminListings).
--
--    Writes are restricted to:
--      - the owning admin (admin_id = auth.uid()), or
--      - a super admin, or
--      - a regional admin whose assigned_region_id appears in the listing's
--        region_path (i.e. every subordinate under their branch).
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

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings_select_authenticated" ON public.listings;
CREATE POLICY "listings_select_authenticated" ON public.listings
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "listings_insert_admin_scope" ON public.listings;
CREATE POLICY "listings_insert_admin_scope" ON public.listings
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_profiles ap WHERE ap.id = auth.uid()
  )
  -- TEMPORARY: any admin may create a listing assigned to any owner. The
  -- previous owner-scoped check (admin_id = auth.uid() OR can_manage_listing(region_path))
  -- is intentionally replaced while the transfer feature is unrestricted.
);

-- Can the actor reassign a listing from p_old_path to p_new_path?
--   - TEMPORARY (product decision): transfer of property is unrestricted right
--     now - any admin can hand a lodge to anyone regardless of region. Revert
--     to the subtree-scoped logic below when this ships for real.
CREATE OR REPLACE FUNCTION can_reassign_listing(p_old_path uuid[], p_new_path uuid[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT true;
$$;

-- Previous (scoped) implementation kept for easy re-enable:
--   SELECT
--     EXISTS (
--       SELECT 1 FROM public.admin_profiles ap
--       WHERE ap.id = auth.uid() AND ap.role = 'super_admin'
--     )
--     OR EXISTS (
--       SELECT 1 FROM public.admin_profiles ap
--       WHERE ap.id = auth.uid() AND ap.role = 'regional_admin'
--         AND ap.assigned_region_id = ANY(COALESCE(p_old_path, '{}'::uuid[]))
--         AND ap.assigned_region_id = ANY(COALESCE(p_new_path, '{}'::uuid[]))
--     )
--     OR (p_old_path IS NOT DISTINCT FROM p_new_path);

DROP POLICY IF EXISTS "listings_update_admin_scope" ON public.listings;
CREATE POLICY "listings_update_admin_scope" ON public.listings
FOR UPDATE TO authenticated
USING (admin_id = auth.uid() OR can_manage_listing(region_path))
WITH CHECK (
  (OLD.admin_id = auth.uid() OR can_manage_listing(OLD.region_path))
  AND can_reassign_listing(OLD.region_path, NEW.region_path)
);

DROP POLICY IF EXISTS "listings_delete_admin_scope" ON public.listings;
CREATE POLICY "listings_delete_admin_scope" ON public.listings
FOR DELETE TO authenticated
USING (admin_id = auth.uid() OR can_manage_listing(region_path));
