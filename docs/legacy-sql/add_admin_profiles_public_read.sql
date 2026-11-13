-- ---------------------------------------------------------------------------
-- Fix: students could not schedule tours - the tour scheduler always hit the
-- "We couldnt load the house admin for this property" fallback screen.
--
-- Verified live: listings reference an admin_id whose row must exist in
-- admin_profiles (enforced by listings_admin_id_fkey) and whose profile row
-- exists, yet SELECTing it as a non-admin returns zero rows with no error -
-- classic RLS row filtering. Existing policies are self-scoped
-- (id = auth.uid()), which is why admin-only screens keep working.
--
-- Fix: let any authenticated user SELECT from admin_profiles. The table holds
-- no sensitive data (id, role, region assignment) and the student-facing tour
-- flow needs it to resolve the house admin. Postgres policies are permissive
-- (OR), so existing self-scoped policies remain fully intact.
--
-- Idempotent - safe to re-run in the Supabase SQL editor.
-- ---------------------------------------------------------------------------

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_profiles_select_authenticated" ON public.admin_profiles;
CREATE POLICY "admin_profiles_select_authenticated"
  ON public.admin_profiles
  FOR SELECT
  TO authenticated
  USING (true);