-- Refresh Region Hierarchy RPC
-- Recomputes the materialized lineage snapshots after structural edits that the
-- row-level triggers cannot cover:
--   - regions.path (covers the whole tree, handles region moves)
--   - admin_profiles.region_path (mirrors assigned region's path)
--   - listings.region_path (mirrors owning admin's region path)
-- The client calls this via supabase.rpc('refresh_region_hierarchy') right after
-- a region has been moved (re-parented), so every listing and admin under the
-- moved subtree immediately reflects the new ancestry.

CREATE OR REPLACE FUNCTION refresh_region_hierarchy()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  UPDATE public.admin_profiles ap
  SET region_path = COALESCE(
    (SELECT r.path FROM public.regions r WHERE r.id = ap.assigned_region_id),
    '{}'::uuid[]
  );

  UPDATE public.listings l
  SET region_path = COALESCE(
    (SELECT ap.region_path FROM public.admin_profiles ap WHERE ap.id = l.admin_id),
    '{}'::uuid[]
  );
END $$;
