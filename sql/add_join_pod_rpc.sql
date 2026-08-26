-- Migration: atomic "join a friend's pod" RPC (`join_pod`).
-- Replaces the client-side multi-step join in services/liquidity-pod-service.ts
-- (insert credit -> insert member -> update pod counter), which could partially
-- fail and drift `current_total_intent` away from reality.
--
-- Guarantees:
--   * One transaction, serialized per pod via SELECT ... FOR UPDATE.
--   * SELF-HEALING occupancy: capacity and share index derive from COUNT of real
--     non-expired members, NEVER from the stored current_total_intent counter.
--     Drifted counters (e.g. extra members on an over-capacity pod) converge on
--     the next join/remove/reconcile instead of corrupting new joins.
--   * Even-share math matches allocateEvenShares/memberAmount exactly:
--     share[i] = floor(total/target) + (i < total % target ? 1 : 0), i = active count.
--
-- Run order: AFTER sql/add_liquidity_pool_schema.sql, sql/add_target_occupancy_and_join.sql
-- and sql/add_payment_flow.sql (the 'expired' enum label must exist).
-- Safe to re-run (CREATE OR REPLACE + REVOKE/GRANT).

-- Guard: abort with a clear message if the prerequisite enum value is missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'slot_credit_status' AND e.enumlabel = 'expired'
  ) THEN
    RAISE EXCEPTION 'Prerequisite missing: enum value "expired" does not exist. Run sql/add_payment_flow.sql first (as its own script).';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.join_pod(p_group_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_code TEXT := UPPER(BTRIM(p_group_code));
  v_pod RECORD;
  v_target INTEGER;
  v_active INTEGER;
  v_rent BIGINT;
  v_total_fee CONSTANT INTEGER := 20000; -- EXPECTED_TOTAL_POD_FEE in utils/liquidity-math.ts
  v_share NUMERIC;
  v_new_intent INTEGER;
  v_finalized BOOLEAN;
  v_credit_id UUID;
  v_deadline TIMESTAMPTZ;
  v_invite_code TEXT;
  v_i INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Please sign in to continue.';
  END IF;

  -- Serialize concurrent joins on the same pod row.
  SELECT * INTO v_pod FROM pods WHERE group_code = v_code FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite code not found. Ask your friend to share their invite code.';
  END IF;

  v_target := COALESCE(v_pod.target_occupancy, v_pod.property_tier);

  -- Truth over trust: recompute occupancy from actual members (self-healing).
  SELECT COALESCE(SUM(pm.intent_size), 0) INTO v_active
  FROM pod_members pm
  JOIN slot_credits sc ON sc.id = pm.slot_credit_id
  WHERE pm.pod_id = v_pod.id AND sc.status <> 'expired';

  IF EXISTS (
    SELECT 1 FROM pod_members pm
    JOIN slot_credits sc ON sc.id = pm.slot_credit_id
    WHERE pm.pod_id = v_pod.id AND pm.user_id = v_user_id AND sc.status <> 'expired'
  ) THEN
    RAISE EXCEPTION 'You are already a member of this group.';
  END IF;

  IF v_active >= v_target THEN
    RAISE EXCEPTION 'This group is already full. Pick another invite code or a lower occupancy.';
  END IF;

  -- Defense-in-depth: the partial unique index enforces this too; fail friendly first.
  IF EXISTS (
    SELECT 1 FROM slot_credits
    WHERE user_id = v_user_id AND listing_id = v_pod.listing_id AND status <> 'expired'
  ) THEN
    RAISE EXCEPTION 'You already have an active reservation for this property.';
  END IF;

  SELECT price_amount::BIGINT INTO v_rent FROM listings WHERE id = v_pod.listing_id;

  -- memberAmount(rent, fee, target, index = v_active): even split, first members absorb the remainder.
  v_share := FLOOR(v_rent / v_target) + CASE WHEN v_active < (v_rent % v_target) THEN 1 ELSE 0 END
           + FLOOR(v_total_fee / v_target) + CASE WHEN v_active < (v_total_fee % v_target) THEN 1 ELSE 0 END;

  v_new_intent := v_active + 1;
  v_finalized := v_new_intent >= v_target;
  v_deadline := NOW() + INTERVAL '3 days'; -- PAYMENT_WINDOW_MS

  -- Mirror generateInviteCode(): GIDA-POD- + 12 chars (no I/O/0/1 lookalikes).
  v_invite_code := 'GIDA-POD-';
  FOR v_i IN 1..12 LOOP
    v_invite_code := v_invite_code || SUBSTRING(
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' FROM FLOOR(RANDOM() * 32)::INT + 1 FOR 1
    );
  END LOOP;

  INSERT INTO slot_credits (
    user_id, estate_id, listing_id, property_tier, intent_size, target_occupancy,
    status, invite_code, payment_deadline, amount_paid
  ) VALUES (
    v_user_id, v_pod.estate_id, v_pod.listing_id, v_pod.property_tier, 1, v_target,
    'booked_pending_claim', v_invite_code, v_deadline, v_share
  ) RETURNING id INTO v_credit_id;

  INSERT INTO pod_members (pod_id, user_id, slot_credit_id, intent_size, amount_paid)
  VALUES (v_pod.id, v_user_id, v_credit_id, 1, v_share);

  -- Counter converges to truth here too; physical_room_id intentionally untouched
  -- (column is UUID; fake 'room-NNN' strings belong to legacy client logic only).
  UPDATE pods
  SET current_total_intent = v_new_intent,
      is_finalized = v_finalized
  WHERE id = v_pod.id;

  RETURN jsonb_build_object(
    'creditId', v_credit_id,
    'podId', v_pod.id,
    'amountPaid', v_share,
    'paymentDeadline', v_deadline,
    'isFinalized', v_finalized,
    'inviteCode', v_invite_code
  );
END;
$$;

REVOKE ALL ON FUNCTION public.join_pod(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_pod(TEXT) TO authenticated, service_role;
