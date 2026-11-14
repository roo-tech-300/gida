alter table public.slot_credits add column if not exists cancelled_at timestamptz;

-- A student can now cancel an unpaid reservation. 'cancelled' is its own status so admins can tell it from a lapsed hold ('expired').
-- Every function that treated 'expired' as "no longer counts" now treats 'cancelled' the same way.

CREATE OR REPLACE FUNCTION public.claim_payment_attempt(p_purchase_kind text, p_purchase_id uuid, p_user_id uuid, p_listing_id uuid)
 RETURNS TABLE(decision text, attempt_id uuid, reference text, authorization_url text, attempt_status text, amount_ngn numeric, is_new boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_attempt public.payment_attempts;
  v_amount NUMERIC;
  v_status TEXT;
  v_pod_verification TEXT;
  v_reference TEXT;
BEGIN
  IF p_purchase_kind NOT IN ('lodge', 'tour', 'location') THEN
    RETURN QUERY SELECT 'invalid_purchase', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, FALSE;
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_purchase_kind || ':' || p_purchase_id::TEXT, 0));

  IF p_purchase_kind = 'lodge' THEN
    SELECT sc.amount_paid, sc.status::TEXT INTO v_amount, v_status
    FROM public.slot_credits sc
    WHERE sc.id = p_purchase_id AND sc.user_id = p_user_id AND sc.listing_id = p_listing_id;
    IF NOT FOUND THEN
      RETURN QUERY SELECT 'not_found', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, FALSE;
      RETURN;
    END IF;
    IF v_status IN ('paid_unmatched', 'matched', 'subletting') THEN
      RETURN QUERY SELECT 'already_paid', NULL::UUID, NULL::TEXT, NULL::TEXT, v_status, v_amount, FALSE;
      RETURN;
    END IF;
    SELECT p.verification_status INTO v_pod_verification
    FROM public.pod_members pm
    JOIN public.pods p ON p.id = pm.pod_id
    WHERE pm.slot_credit_id = p_purchase_id AND pm.user_id = p_user_id
    LIMIT 1;
    IF v_pod_verification IN ('pending_verification', 'rejected') THEN
      RETURN QUERY SELECT 'not_payable', NULL::UUID, NULL::TEXT, NULL::TEXT, v_pod_verification, v_amount, FALSE;
      RETURN;
    END IF;
    IF v_amount IS NULL OR v_amount <= 0 OR v_status IN ('expired', 'cancelled') THEN
      RETURN QUERY SELECT 'not_payable', NULL::UUID, NULL::TEXT, NULL::TEXT, v_status, v_amount, FALSE;
      RETURN;
    END IF;
  ELSIF p_purchase_kind = 'tour' THEN
    SELECT tb.status INTO v_status
    FROM public.tour_bookings tb
    WHERE tb.id = p_purchase_id AND tb.user_id = p_user_id AND tb.listing_id = p_listing_id;
    IF NOT FOUND THEN
      RETURN QUERY SELECT 'not_found', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, FALSE;
      RETURN;
    END IF;
    IF v_status = 'booked' THEN
      RETURN QUERY SELECT 'already_paid', NULL::UUID, NULL::TEXT, NULL::TEXT, v_status, 2000::NUMERIC, FALSE;
      RETURN;
    END IF;
    IF v_status <> 'pending_payment' THEN
      RETURN QUERY SELECT 'not_payable', NULL::UUID, NULL::TEXT, NULL::TEXT, v_status, 2000::NUMERIC, FALSE;
      RETURN;
    END IF;
    v_amount := 2000;
  ELSE
    IF EXISTS (
      SELECT 1 FROM public.location_access_payments lap
      WHERE lap.user_id = p_user_id AND lap.listing_id = p_listing_id
    ) THEN
      RETURN QUERY SELECT 'already_paid', NULL::UUID, NULL::TEXT, NULL::TEXT, 'paid', 500::NUMERIC, FALSE;
      RETURN;
    END IF;
    IF p_purchase_id <> p_listing_id THEN
      RETURN QUERY SELECT 'invalid_purchase', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, FALSE;
      RETURN;
    END IF;
    v_amount := 500;
  END IF;

  SELECT pa.* INTO v_attempt FROM public.payment_attempts pa
  WHERE pa.purchase_kind = p_purchase_kind AND pa.purchase_id = p_purchase_id
  FOR UPDATE;

  IF FOUND AND v_attempt.status = 'paid' THEN
    RETURN QUERY SELECT 'already_paid', v_attempt.id, v_attempt.reference,
      v_attempt.authorization_url, v_attempt.status, v_amount, FALSE;
    RETURN;
  END IF;

  IF FOUND AND v_attempt.status IN ('initializing', 'pending') THEN
    RETURN QUERY SELECT
      CASE WHEN v_attempt.authorization_url IS NULL THEN 'initializing' ELSE 'reuse' END,
      v_attempt.id, v_attempt.reference, v_attempt.authorization_url,
      v_attempt.status, v_amount, FALSE;
    RETURN;
  END IF;

  v_reference := 'GIDA-' || UPPER(p_purchase_kind) || '-' || REPLACE(gen_random_uuid()::TEXT, '-', '');
  IF FOUND THEN
    UPDATE public.payment_attempts pa SET
      user_id = p_user_id,
      listing_id = p_listing_id,
      reference = v_reference,
      authorization_url = NULL,
      status = 'initializing',
      created_at = NOW(),
      updated_at = NOW()
    WHERE pa.id = v_attempt.id
    RETURNING pa.* INTO v_attempt;
  ELSE
    INSERT INTO public.payment_attempts (purchase_kind, purchase_id, user_id, listing_id, reference, status)
    VALUES (p_purchase_kind, p_purchase_id, p_user_id, p_listing_id, v_reference, 'initializing')
    RETURNING * INTO v_attempt;
  END IF;

  RETURN QUERY SELECT 'new', v_attempt.id, v_attempt.reference, NULL::TEXT, v_attempt.status, v_amount, TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_single_active_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Expired credits are always allowed (rebooking after expiry must work).
  IF NEW.status IN ('expired', 'cancelled') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.slot_credits sc
    WHERE sc.user_id = NEW.user_id
      AND sc.listing_id = NEW.listing_id
      AND sc.status NOT IN ('expired', 'cancelled')
  ) THEN
    RAISE EXCEPTION 'You already have an active reservation for this property.';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_active_booking(p_listing_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT sc.id
  FROM public.slot_credits sc
  WHERE sc.user_id = auth.uid()
    AND sc.listing_id = p_listing_id
    AND sc.status NOT IN ('expired', 'cancelled')
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_payment_link(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row record;
  v_pod_status text;
  v_status text;
begin
  select l.expires_at, l.revoked_at,
         c.id as credit_id, c.user_id, c.listing_id, c.status as credit_status,
         c.amount_paid, c.payment_deadline, c.target_occupancy,
         li.title, li.location_landmark,
         split_part(btrim(coalesce(pr.full_name, '')), ' ', 1) as first_name
    into v_row
    from public.payment_links l
    join public.slot_credits c on c.id = l.credit_id
    left join public.listings li on li.id = c.listing_id
    left join public.profiles pr on pr.id = c.user_id
   where l.token = p_token;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  select p.verification_status::text
    into v_pod_status
    from public.pod_members pm
    join public.pods p on p.id = pm.pod_id
   where pm.slot_credit_id = v_row.credit_id
   limit 1;

  v_status := case
    when v_row.credit_status in ('paid_unmatched', 'matched', 'subletting') then 'paid'
    when v_row.revoked_at is not null
      or v_row.credit_status IN ('expired', 'cancelled')
      or v_row.expires_at <= now()
      or v_row.payment_deadline <= now() then 'expired'
    when v_pod_status in ('pending_verification', 'rejected') then 'not_ready'
    else 'open'
  end;

  return jsonb_build_object(
    'status', v_status,
    'credit_id', v_row.credit_id,
    'student_id', v_row.user_id,
    'listing_id', v_row.listing_id,
    'listing_title', v_row.title,
    'location', v_row.location_landmark,
    'student_first_name', nullif(v_row.first_name, ''),
    'amount', v_row.amount_paid,
    'deadline', v_row.payment_deadline,
    'target_occupancy', v_row.target_occupancy
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_household_chats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(row_json order by sort_at desc), '[]'::jsonb)
    into v_result
    from (
      select
        coalesce(last.created_at, mine.joined_at) as sort_at,
        jsonb_build_object(
          'podId', mine.pod_id,
          'listingTitle', li.title,
          'memberCount', members.member_count,
          'memberIds', members.ids,
          'memberNames', members.names,
          'lastMessage', last.body,
          'lastMessageAt', last.created_at,
          'lastSenderId', last.sender_id,
          'lastSenderName', last.sender_name,
          'unreadCount', (
            select least(count(*), 99)
              from public.household_messages hm
             where hm.pod_id = mine.pod_id
               and hm.sender_id <> v_uid
               and hm.created_at > coalesce(
                     (select r.last_read_at from public.household_reads r
                       where r.pod_id = mine.pod_id and r.user_id = v_uid),
                     '-infinity'::timestamptz)
          )
        ) as row_json
      from (
        select pm.pod_id, pm.created_at as joined_at
          from public.pod_members pm
          join public.slot_credits sc on sc.id = pm.slot_credit_id
          join public.pods p on p.id = pm.pod_id
         where pm.user_id = v_uid
           and sc.status NOT IN ('expired', 'cancelled')
           and p.verification_status <> 'rejected'
      ) mine
      join public.pods pod on pod.id = mine.pod_id
      left join public.listings li on li.id = pod.listing_id
      cross join lateral (
        select count(*)::int as member_count,
               array_agg(pm2.user_id order by pm2.created_at) as ids,
               array_agg(split_part(btrim(coalesce(pr.full_name, 'Housemate')), ' ', 1) order by pm2.created_at) as names
          from public.pod_members pm2
          join public.slot_credits sc2 on sc2.id = pm2.slot_credit_id and sc2.status NOT IN ('expired', 'cancelled')
          left join public.profiles pr on pr.id = pm2.user_id
         where pm2.pod_id = mine.pod_id
      ) members
      left join lateral (
        select hm.body, hm.created_at, hm.sender_id,
               split_part(btrim(coalesce(sp.full_name, 'Housemate')), ' ', 1) as sender_name
          from public.household_messages hm
          left join public.profiles sp on sp.id = hm.sender_id
         where hm.pod_id = mine.pod_id
         order by hm.created_at desc
         limit 1
      ) last on true
      where members.member_count >= 2
    ) rows;

  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_household_member(p_pod_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
      from public.pod_members pm
      join public.slot_credits sc on sc.id = pm.slot_credit_id
      join public.pods p on p.id = pm.pod_id
     where pm.pod_id = p_pod_id
       and pm.user_id = auth.uid()
       and sc.status NOT IN ('expired', 'cancelled')
       and p.verification_status <> 'rejected'
  );
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

  -- Truth over trust: recompute occupancy from actual members (self-healing).
  SELECT COALESCE(SUM(pm.intent_size), 0) INTO v_active
  FROM pod_members pm
  JOIN slot_credits sc ON sc.id = pm.slot_credit_id
  WHERE pm.pod_id = v_pod.id AND sc.status NOT IN ('expired', 'cancelled');

  IF EXISTS (
    SELECT 1 FROM pod_members pm
    JOIN slot_credits sc ON sc.id = pm.slot_credit_id
    WHERE pm.pod_id = v_pod.id AND pm.user_id = v_user_id AND sc.status NOT IN ('expired', 'cancelled')
  ) THEN
    RAISE EXCEPTION 'You are already a member of this group.';
  END IF;

  IF v_active >= v_target THEN
    RAISE EXCEPTION 'This group is already full. Pick another invite code or a lower occupancy.';
  END IF;

  -- Defense-in-depth: the partial unique index enforces this too; fail friendly first.
  IF EXISTS (
    SELECT 1 FROM slot_credits
    WHERE user_id = v_user_id AND listing_id = v_pod.listing_id AND status NOT IN ('expired', 'cancelled')
  ) THEN
    RAISE EXCEPTION 'You already have an active reservation for this property.';
  END IF;

  -- ✅ FIX: Read founder's locked share so every joiner pays exactly what the founder paid
  SELECT sc.amount_paid INTO v_locked_share
  FROM pod_members pm
  JOIN slot_credits sc ON sc.id = pm.slot_credit_id
  WHERE pm.pod_id = v_pod.id
    AND sc.status NOT IN ('expired', 'cancelled')
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

  INSERT INTO pod_members (pod_id, user_id, slot_credit_id, intent_size, amount_paid)
  VALUES (v_pod.id, v_user_id, v_credit_id, 1, v_share);

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

CREATE OR REPLACE FUNCTION public.get_spots_left(p_listing_ids uuid[])
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(jsonb_object_agg(l.id::text, greatest(0, spots.total - coalesce(held.n, 0))), '{}'::jsonb)
    from public.listings l
    cross join lateral (
      select coalesce(l.abstract_slots_available,
                      coalesce(l.units_available, 1) * greatest(1, coalesce(l.property_tier, l.max_roommates, 1))) as total
    ) spots
    left join lateral (
      select count(*)::int as n
        from public.slot_credits sc
       where sc.listing_id = l.id and sc.status NOT IN ('expired', 'cancelled')
    ) held on true
   where l.id = any (p_listing_ids)
     and cardinality(p_listing_ids) <= 100;
$function$;

CREATE OR REPLACE FUNCTION public.reconcile_pod_after_credit_expiry(p_slot_credit_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pod_id UUID;
  v_active INTEGER;
  v_target INTEGER;
BEGIN
  SELECT pm.pod_id INTO v_pod_id
  FROM public.pod_members pm
  WHERE pm.slot_credit_id = p_slot_credit_id
    AND (pm.user_id = auth.uid() OR auth.uid() IS NULL)
  LIMIT 1;

  IF v_pod_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(pm.intent_size), 0)
  INTO v_active
  FROM public.pod_members pm
  JOIN public.slot_credits sc ON sc.id = pm.slot_credit_id
  WHERE pm.pod_id = v_pod_id
    AND sc.status NOT IN ('expired', 'cancelled');

  SELECT COALESCE(p.target_occupancy, p.property_tier)
  INTO v_target
  FROM public.pods p
  WHERE p.id = v_pod_id;

  UPDATE public.pods
  SET current_total_intent = v_active,
      is_finalized = v_active >= COALESCE(v_target, property_tier)
  WHERE id = v_pod_id;

  RETURN v_pod_id;
END;
$function$;

-- Lets a student cancel their own reservation while it is still unpaid.
-- Paid reservations are refused: refunds are a separate decision.
create or replace function public.cancel_reservation(p_credit_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_credit public.slot_credits%rowtype;
begin
  if v_uid is null then
    raise exception 'NOT_SIGNED_IN' using errcode = '28000';
  end if;

  select * into v_credit from public.slot_credits where id = p_credit_id for update;
  if not found or v_credit.user_id is distinct from v_uid then
    raise exception 'RESERVATION_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Already over: cancelling again is a no-op, not an error.
  if v_credit.status in ('expired', 'cancelled') then
    return jsonb_build_object('success', true, 'already_ended', true);
  end if;

  if v_credit.status not in ('booked', 'booked_pending_claim') or v_credit.paid_at is not null then
    raise exception 'ALREADY_PAID' using errcode = 'P0001';
  end if;

  update public.slot_credits
     set status = 'cancelled', cancelled_at = now()
   where id = p_credit_id;

  perform public.reconcile_pod_after_credit_expiry(p_credit_id);

  return jsonb_build_object('success', true, 'already_ended', false);
end;
$function$;

revoke all on function public.cancel_reservation(uuid) from public, anon;
grant execute on function public.cancel_reservation(uuid) to authenticated;
