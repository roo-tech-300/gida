-- Admin UPDATE policy on slot_credits: allows admins to accept/reject applications
-- for listings they manage. Service-layer filtering (fetchAdminListingIds) restricts
-- which listing IDs each role can see; this policy gates UPDATE to admins who are
-- referenced in admin_profiles (any role).
-- Run this in Supabase SQL Editor.

DROP POLICY IF EXISTS "slot_credits_update_admin" ON public.slot_credits;
CREATE POLICY "slot_credits_update_admin"
  ON public.slot_credits
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = auth.uid()
    )
  )
  WITH CHECK (true);
