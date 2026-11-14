-- A household locked to one gender must only ever hold that gender.
-- join_pod never checked it, and pod_members_insert_own lets a student add themselves to any
-- household directly, so the rule lives in a trigger on pod_members as well as in join_pod.

-- True for an ordinary signed-in student. Admins, the service role (the worker) and direct
-- database sessions are not "students", so the guards below do not apply to them.
create or replace function public.is_student_caller()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(auth.role() = 'authenticated', false)
     and not exists (select 1 from public.admin_profiles ap where ap.id = auth.uid());
$function$;

create or replace function public.assert_gender_fits_pod(p_pod_id uuid, p_user_id uuid)
returns void
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_lock text;
  v_gender text;
begin
  select matched_gender::text into v_lock from public.pods where id = p_pod_id;
  if v_lock in ('MALE', 'FEMALE') then
    select gender into v_gender from public.profiles where id = p_user_id;
    if v_gender is null then
      raise exception 'Add your gender to your profile to join this household.' using errcode = 'P0001';
    end if;
    if v_gender is distinct from v_lock then
      raise exception 'This household is for % only.', case when v_lock = 'FEMALE' then 'women' else 'men' end using errcode = 'P0001';
    end if;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.join_pod(p_group_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_code TEXT := UPPER(BTRIM(p_group_code));
  v_pod RECORD;
  v_target INTEGER;
  v_active INTEGER;
  v_rent BIGINT;
  v_share NUMERIC;
  v_new_intent INTEGER;
  v_finalized BOOLEAN;
  v_credit_id UUID;
  v_deadline TIMESTAMPTZ;
  v_invite_code TEXT;
  v_i INTEGER;
  -- Founder's locked share: read from the earliest non-expired member credit
  v_locked_share NUMERIC;
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

  -- A household locked to one gender only lets that gender in.
  PERFORM public.assert_gender_fits_pod(v_pod.id, v_user_id);

  -- Truth over trust: recompute occupancy from actual members (self-healing).
  SELECT COALESCE(SUM(pm.intent_size), 0) INTO v_active
  FROM pod_members pm
  JOIN slot_credits sc ON sc.id = pm.slot_credit_id
  WHERE pm.pod_id = v_pod.id AND sc.status NOT IN ('expired', 'cancelled', 'rejected');

  IF EXISTS (
    SELECT 1 FROM pod_members pm
    JOIN slot_credits sc ON sc.id = pm.slot_credit_id
    WHERE pm.pod_id = v_pod.id AND pm.user_id = v_user_id AND sc.status NOT IN ('expired', 'cancelled', 'rejected')
  ) THEN
    RAISE EXCEPTION 'You are already a member of this group.';
  END IF;

  IF v_active >= v_target THEN
    RAISE EXCEPTION 'This group is already full. Pick another invite code or a lower occupancy.';
  END IF;

  -- Defense-in-depth: the partial unique index enforces this too; fail friendly first.
  IF EXISTS (
    SELECT 1 FROM slot_credits
    WHERE user_id = v_user_id AND listing_id = v_pod.listing_id AND status NOT IN ('expired', 'cancelled', 'rejected')
  ) THEN
    RAISE EXCEPTION 'You already have an active reservation for this property.';
  END IF;

  -- ✅ FIX: Read founder's locked share so every joiner pays exactly what the founder paid
  SELECT sc.amount_paid INTO v_locked_share
  FROM pod_members pm
  JOIN slot_credits sc ON sc.id = pm.slot_credit_id
  WHERE pm.pod_id = v_pod.id
    AND sc.status NOT IN ('expired', 'cancelled', 'rejected')
    AND sc.amount_paid IS NOT NULL
    AND sc.amount_paid > 0
  ORDER BY sc.created_at ASC, sc.id ASC
  LIMIT 1;

  -- ✅ FIX: Use founder's share if available; otherwise compute from price (should rarely happen)
  IF v_locked_share IS NOT NULL THEN
    v_share := v_locked_share;
  ELSE
    -- Fallback: read price from listings and compute equal share
    SELECT price_amount::NUMERIC INTO v_rent FROM listings WHERE id = v_pod.listing_id;
    v_share := ROUND(v_rent / NULLIF(v_target, 0), 2);
  END IF;

  v_new_intent := v_active + 1;
  v_finalized := v_new_intent >= v_target;
  v_deadline := NOW() + INTERVAL '3 days';

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

  -- A student who left this household earlier (hold lapsed, cancelled or rejected) still has a
  -- membership row; reuse it for the new reservation instead of colliding with it.
  UPDATE pod_members
  SET slot_credit_id = v_credit_id, intent_size = 1, amount_paid = v_share, created_at = NOW()
  WHERE pod_id = v_pod.id AND user_id = v_user_id;

  IF NOT FOUND THEN
    INSERT INTO pod_members (pod_id, user_id, slot_credit_id, intent_size, amount_paid)
    VALUES (v_pod.id, v_user_id, v_credit_id, 1, v_share);
  END IF;

  -- Counter converges to truth here too; physical_room_id intentionally untouched
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
$function$;

create or replace function public.pod_members_gender_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if public.is_student_caller() then
    perform public.assert_gender_fits_pod(new.pod_id, new.user_id);
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_pod_members_gender_guard on public.pod_members;
create trigger trg_pod_members_gender_guard
  before insert on public.pod_members
  for each row execute function public.pod_members_gender_guard();
