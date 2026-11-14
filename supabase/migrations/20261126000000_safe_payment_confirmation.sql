-- Money must never arrive for a reservation that cannot take it.
--  1. A payment in progress (a checkout started in the last 30 minutes) blocks a student from cancelling or
--     letting go of that reservation, and the lapsed-hold sweep leaves it alone.
--  2. confirm_slot_payment decides what a payment that has arrived means: pay the reservation, it was already
--     paid, or it cannot be paid and must be refunded (cancelled, rejected, or lapsed with its seat taken).
--  3. A checkout nobody finished within half an hour is stale, so a new one can start.

alter table public.payment_attempts drop constraint if exists payment_attempts_status_check;
alter table public.payment_attempts add constraint payment_attempts_status_check
  check (status = any (array['initializing', 'pending', 'paid', 'failed', 'refunded', 'refund_failed']));

create or replace function public.payment_in_progress(p_credit_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1 from public.payment_attempts pa
     where pa.purchase_kind = 'lodge' and pa.purchase_id = p_credit_id
       and pa.status in ('initializing', 'pending')
       and pa.updated_at > now() - interval '30 minutes'
  );
$function$;

-- 'paid': the reservation is now paid. 'already_paid': nothing to do. 'refund': hand the money back.
create or replace function public.confirm_slot_payment(p_credit_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  c public.slot_credits%rowtype;
  v_pod uuid;
  v_target integer;
  v_status text;
  v_live integer;
  v_units integer;
begin
  select * into c from public.slot_credits where id = p_credit_id for update;
  if not found then
    return 'refund';
  end if;
  if c.status in ('paid_unmatched', 'matched', 'subletting') then
    return 'already_paid';
  end if;
  if c.status in ('cancelled', 'rejected') then
    return 'refund';
  end if;

  select pm.pod_id into v_pod from public.pod_members pm where pm.slot_credit_id = p_credit_id limit 1;

  -- A reservation whose hold ran out may still be paid, but only if its seat is still free.
  if c.status = 'expired' and v_pod is not null then
    select coalesce(p.target_occupancy, p.property_tier), p.verification_status::text into v_target, v_status from public.pods p where p.id = v_pod;
    if v_status = 'rejected' then
      return 'refund';
    end if;
    select coalesce(sum(pm.intent_size), 0) into v_live
      from public.pod_members pm join public.slot_credits sc on sc.id = pm.slot_credit_id
     where pm.pod_id = v_pod and sc.id <> p_credit_id
       and public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id);
    if v_live + public.pod_ghost_seats(v_pod, null) >= v_target then
      return 'refund';
    end if;
    if v_live = 0 then
      -- Nobody else is in the household any more, so it needs a free unit of the listing to come back.
      perform pg_advisory_xact_lock(hashtextextended(c.listing_id::text, 0));
      select coalesce(units_available, 1) into v_units from public.listings where id = c.listing_id;
      if public.households_in_use(c.listing_id, v_pod) >= coalesce(v_units, 1) then
        return 'refund';
      end if;
    end if;
  end if;

  begin
    update public.slot_credits set status = 'paid_unmatched', paid_at = now(), expired_at = null where id = p_credit_id;
  exception when unique_violation then
    -- They reserved the same place again in the meantime; this old reservation cannot come back.
    return 'refund';
  end;

  if v_pod is not null then
    update public.pods p
       set current_total_intent = coalesce((
             select sum(pm.intent_size) from public.pod_members pm join public.slot_credits sc on sc.id = pm.slot_credit_id
              where pm.pod_id = p.id and public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id)), 0)
     where p.id = v_pod;
  end if;
  return 'paid';
end;
$function$;

revoke all on function public.payment_in_progress(uuid) from public, anon, authenticated;
revoke all on function public.confirm_slot_payment(uuid) from public, anon, authenticated;
grant execute on function public.confirm_slot_payment(uuid) to service_role;

CREATE OR REPLACE FUNCTION public.guard_slot_credit_writes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_price numeric;
  v_limit integer;
  v_share numeric;
  v_lapses integer;
  v_hold_hours integer;
begin
  if not public.is_student_caller() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.user_id is distinct from auth.uid() then
      raise exception 'You can only reserve for yourself.' using errcode = 'P0001';
    end if;
    if new.status not in ('booked', 'booked_pending_claim') or new.paid_at is not null then
      raise exception 'A new reservation cannot start out paid.' using errcode = 'P0001';
    end if;

    select price_amount, greatest(coalesce(max_roommates, 1), coalesce(property_tier, 1))
      into v_price, v_limit
      from public.listings where id = new.listing_id;
    if v_price is not null then
      if new.target_occupancy is null or new.target_occupancy < 1 or new.target_occupancy > v_limit then
        raise exception 'That household size is not available for this place.' using errcode = 'P0001';
      end if;
      -- The share is never lower than the rent split; a joiner may keep a higher locked share.
      v_share := round(v_price / new.target_occupancy, 2);
      new.amount_paid := greatest(coalesce(new.amount_paid, 0), v_share);
    end if;

    -- One unpaid spot at a time: pay for it or cancel it before holding another.
    if exists (
      select 1 from public.slot_credits sc
       where sc.user_id = auth.uid() and sc.status in ('booked', 'booked_pending_claim') and sc.paid_at is null
         and public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id)
    ) then
      raise exception 'You already hold an unpaid spot. Pay for it or cancel it first.' using errcode = 'P0001';
    end if;

    -- Two holds that ran out in the last day pause new reservations until a day after the latest.
    select count(*) into v_lapses from public.slot_credits sc
     where sc.user_id = auth.uid() and sc.status = 'expired' and sc.paid_at is null and sc.expired_at > now() - interval '24 hours';
    if v_lapses >= 2 then
      raise exception 'Two of your holds ran out recently. Please wait a day before reserving again.' using errcode = 'P0001';
    end if;

    -- The hold is the server's clock, not the phone's. A friend's seat is shorter (24h); never longer than 3 days.
    v_hold_hours := least(72, coalesce(nullif(current_setting('app.seat_hold_hours', true), '')::integer, 72));
    new.payment_deadline := now() + make_interval(hours => v_hold_hours);
    new.expired_at := null;
    new.cancelled_at := null;
    new.rejected_at := null;
    return new;
  end if;

  -- UPDATE by a student: only ever ending an unpaid reservation.
  if new.user_id is distinct from old.user_id
     or new.listing_id is distinct from old.listing_id
     or new.estate_id is distinct from old.estate_id
     or new.property_tier is distinct from old.property_tier
     or new.intent_size is distinct from old.intent_size
     or new.target_occupancy is distinct from old.target_occupancy
     or new.amount_paid is distinct from old.amount_paid
     or new.payment_deadline is distinct from old.payment_deadline
     or new.paid_at is distinct from old.paid_at
     or new.rejected_at is distinct from old.rejected_at then
    raise exception 'That part of a reservation cannot be changed.' using errcode = 'P0001';
  end if;

  if new.status is distinct from old.status then
    if old.status in ('paid_unmatched', 'matched', 'subletting') then
      raise exception 'ALREADY_PAID' using errcode = 'P0001';
    end if;
    -- Ending a reservation while its payment is still going through would take the money and leave nothing to pay for.
    if public.payment_in_progress(old.id) then
      raise exception 'A payment for this reservation is still processing. Please wait a few minutes.' using errcode = 'P0001';
    end if;
    if old.status in ('expired', 'cancelled', 'rejected') or new.status not in ('expired', 'cancelled') then
      raise exception 'That change to a reservation is not allowed.' using errcode = 'P0001';
    end if;
  elsif (new.expired_at is distinct from old.expired_at and new.status <> 'expired')
     or (new.cancelled_at is distinct from old.cancelled_at and new.status <> 'cancelled') then
    raise exception 'That part of a reservation cannot be changed.' using errcode = 'P0001';
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.expire_lapsed_holds(p_user uuid DEFAULT NULL::uuid, p_listing uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_ids uuid[];
  v_count integer;
begin
  with lapsed as (
    update public.slot_credits sc
       set status = 'expired', expired_at = now()
     where sc.status in ('booked', 'booked_pending_claim')
       and sc.paid_at is null
       and sc.payment_deadline < now()
       and not public.payment_in_progress(sc.id)
       and (p_user is null or sc.user_id = p_user)
       and (p_listing is null or sc.listing_id = p_listing)
       and not exists (
         select 1 from public.pod_members pm join public.pods p on p.id = pm.pod_id
          where pm.slot_credit_id = sc.id and p.verification_status = 'pending_verification')
    returning sc.id
  )
  select array_agg(id) into v_ids from lapsed;

  v_count := coalesce(array_length(v_ids, 1), 0);
  if v_count > 0 then
    -- Links sent by someone whose hold ran out stop working.
    update public.household_invites i set revoked_at = now()
      from public.slot_credits c
     where c.id = any (v_ids) and i.created_by = c.user_id and i.claimed_at is null and i.revoked_at is null;
    -- Households lose the expired members from their count, as reconcile_pod_after_credit_expiry does.
    update public.pods p
       set current_total_intent = live.n,
           is_finalized = live.n >= coalesce(p.target_occupancy, p.property_tier)
      from (
        select pm.pod_id,
               coalesce(sum(pm.intent_size) filter (where c.status not in ('expired', 'cancelled', 'rejected')), 0) as n
          from public.pod_members pm join public.slot_credits c on c.id = pm.slot_credit_id
         where pm.pod_id in (select pm2.pod_id from public.pod_members pm2 where pm2.slot_credit_id = any (v_ids))
         group by pm.pod_id
      ) live
     where p.id = live.pod_id;
  end if;
  return v_count;
end;
$function$;

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
    IF v_amount IS NULL OR v_amount <= 0 OR v_status IN ('expired', 'cancelled', 'rejected') THEN
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

  -- A checkout nobody finished within half an hour is stale: start a fresh one rather than reusing it forever.
  IF FOUND AND v_attempt.status IN ('initializing', 'pending') AND v_attempt.updated_at > NOW() - INTERVAL '30 minutes' THEN
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
