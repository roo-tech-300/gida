-- get_pod_member_payment_statuses: safely expose payment statuses for members
-- of pods YOU belong to.
--
-- Why: slot_credits RLS only exposes a user's OWN row (see slot_credits_select_own
-- in sql/add_target_occupancy_and_join.sql), so the client's batched
-- `select('id, status').in('id', creditIds)` silently drops every credit that
-- isn't the caller's own. That left member.credit_status unset for co-members
-- and made the UI fall back to amount_paid, falsely showing "Paid".
--
-- This SECURITY DEFINER RPC bypasses slot_credits SELECT RLS but still gates on
-- membership: a caller only receives statuses for pods they are a member of
-- (`pm.pod_id IN (SELECT pod_id FROM pod_members WHERE user_id = auth.uid())`).
--
-- Run after sql/add_target_occupancy_and_join.sql (needs slot_credits, pod_members).
-- Safe to re-run (CREATE OR REPLACE + REVOKE/GRANT).
CREATE OR REPLACE FUNCTION public.get_pod_member_payment_statuses(p_pod_ids UUID[])
RETURNS TABLE (pod_id UUID, user_id UUID, slot_credit_id UUID, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY (
    SELECT pm.pod_id, pm.user_id, pm.slot_credit_id, sc.status::TEXT
    FROM pod_members pm
    JOIN slot_credits sc ON sc.id = pm.slot_credit_id
    WHERE pm.pod_id = ANY(p_pod_ids)
      AND pm.pod_id IN (SELECT pod_id FROM pod_members WHERE user_id = auth.uid())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_pod_member_payment_statuses(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pod_member_payment_statuses(UUID[]) TO authenticated, service_role;