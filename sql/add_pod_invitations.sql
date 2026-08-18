-- Migration: pod invitations — lets users invite friends by name before they join
-- Run this in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS pod_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  inviter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invitee_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pod_id, invitee_user_id)
);

ALTER TABLE public.pod_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pod_invitations_select_authenticated" ON public.pod_invitations;
CREATE POLICY "pod_invitations_select_authenticated" ON public.pod_invitations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pod_invitations_insert_own" ON public.pod_invitations;
CREATE POLICY "pod_invitations_insert_own" ON public.pod_invitations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = inviter_user_id);

DROP POLICY IF EXISTS "pod_invitations_update_own" ON public.pod_invitations;
CREATE POLICY "pod_invitations_update_own" ON public.pod_invitations
  FOR UPDATE TO authenticated USING (auth.uid() = inviter_user_id OR auth.uid() = invitee_user_id)
  WITH CHECK (auth.uid() = inviter_user_id OR auth.uid() = invitee_user_id);
