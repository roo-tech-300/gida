-- RPC to atomically remove a member from a pod
-- Only the founder (first member) can remove unpaid members
-- Decrements current_total_intent and recalculates is_finalized

CREATE OR REPLACE FUNCTION remove_member_from_pod(
  p_pod_id UUID,
  p_target_user_id UUID
)
RETURNS TABLE (
  id UUID,
  current_total_intent INTEGER,
  is_finalized BOOLEAN,
  physical_room_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_founder_id UUID;
  v_target_record RECORD;
  v_removed_intent INTEGER;
  v_next_intent INTEGER;
  v_target_occupancy INTEGER;
  v_new_finalized BOOLEAN;
BEGIN
  -- Verify the caller is a member of this pod
  IF NOT EXISTS (
    SELECT 1 FROM pod_members
    WHERE pod_id = p_pod_id AND user_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'You are not a member of this pod.';
  END IF;

  -- Identify the founder (earliest member by created_at)
  SELECT pm.user_id INTO v_founder_id
  FROM pod_members pm
  WHERE pm.pod_id = p_pod_id
  ORDER BY pm.created_at ASC
  LIMIT 1;

  IF v_caller_id != v_founder_id THEN
    RAISE EXCEPTION 'Only the group founder can remove members.';
  END IF;

  -- Fetch the target member
  SELECT pm.slot_credit_id, pm.intent_size INTO v_target_record
  FROM pod_members pm
  WHERE pm.pod_id = p_pod_id AND pm.user_id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found in this group.';
  END IF;

  IF v_caller_id = p_target_user_id THEN
    RAISE EXCEPTION 'You cannot remove yourself from the group.';
  END IF;

  -- Check if target has paid (via slot_credits.amount_paid)
  IF v_target_record.slot_credit_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM slot_credits
      WHERE id = v_target_record.slot_credit_id
        AND status IN ('paid_unmatched', 'matched')
    ) THEN
      RAISE EXCEPTION 'Paid members cannot be removed.';
    END IF;
  END IF;

  -- Delete the member
  DELETE FROM pod_members
  WHERE pod_id = p_pod_id AND user_id = p_target_user_id;

  -- Get target occupancy from the pod
  SELECT p.target_occupancy INTO v_target_occupancy
  FROM pods p WHERE p.id = p_pod_id;

  -- Expire the removed member's slot credit if one exists
  IF v_target_record.slot_credit_id IS NOT NULL THEN
    UPDATE slot_credits
    SET status = 'expired'
    WHERE id = v_target_record.slot_credit_id
      AND status NOT IN ('paid_unmatched', 'matched');
  END IF;

  -- Decrement intent count
  v_removed_intent := COALESCE(v_target_record.intent_size, 1);
  SELECT p.current_total_intent INTO v_next_intent
  FROM pods p WHERE p.id = p_pod_id;
  v_next_intent := GREATEST(0, v_next_intent - v_removed_intent);

  -- Recalculate finalized
  v_new_finalized := v_next_intent >= v_target_occupancy;

  -- Update the pod
  UPDATE pods
  SET current_total_intent = v_next_intent,
      is_finalized = v_new_finalized
  WHERE id = p_pod_id;

  RETURN QUERY
  SELECT pods.id, pods.current_total_intent, pods.is_finalized, pods.physical_room_id
  FROM pods WHERE pods.id = p_pod_id;
END;
$$;
