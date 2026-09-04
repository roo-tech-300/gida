-- Migration: Allow admins to see slot_credits for listings they manage
-- Without this, RLS only lets users see their own reservations.
-- Run this in Supabase SQL editor.

CREATE POLICY "slot_credits_select_admin" ON public.slot_credits
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = slot_credits.listing_id
        AND l.admin_id = auth.uid()
    )
  );
