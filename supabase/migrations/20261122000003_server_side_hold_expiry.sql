-- Holds that have run out are released on the server.
-- Until now only the student's phone marked a hold expired, and the worker's two-hourly job also
-- expired requests still waiting for an admin, whose hold has not started. One rule lives here:
-- an unpaid reservation whose 3-day hold has passed expires, unless its household is still waiting
-- for admin review (that clock starts at approval).

create or replace function public.expire_lapsed_holds(p_user uuid default null, p_listing uuid default null)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
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

revoke all on function public.expire_lapsed_holds(uuid, uuid) from public, anon, authenticated;
grant execute on function public.expire_lapsed_holds(uuid, uuid) to service_role;

-- Whoever asks about a student's booking, or starts a new one, first releases that student's own
-- lapsed hold, so a stale row never blocks them between scheduled runs.
create or replace function public.has_active_booking(p_listing_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id uuid;
begin
  perform public.expire_lapsed_holds(auth.uid(), p_listing_id);
  select sc.id into v_id
    from public.slot_credits sc
   where sc.user_id = auth.uid()
     and sc.listing_id = p_listing_id
     and sc.status not in ('expired', 'cancelled', 'rejected')
   limit 1;
  return v_id;
end;
$function$;

create or replace function public.slot_credits_release_own_lapsed_hold()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  perform public.expire_lapsed_holds(new.user_id, new.listing_id);
  return new;
end;
$function$;

-- Named to run before trg_enforce_single_active_booking.
drop trigger if exists trg_a_release_own_lapsed_hold on public.slot_credits;
create trigger trg_a_release_own_lapsed_hold
  before insert on public.slot_credits
  for each row execute function public.slot_credits_release_own_lapsed_hold();

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

  -- A hold of theirs that has already run out must not count against them.
  PERFORM public.expire_lapsed_holds(v_user_id, NULL);

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
       where sc.listing_id = l.id and sc.status NOT IN ('expired', 'cancelled', 'rejected')
         and not (sc.status in ('booked', 'booked_pending_claim') and sc.paid_at is null and sc.payment_deadline < now()
                  and not exists (select 1 from public.pod_members pm join public.pods p on p.id = pm.pod_id
                                   where pm.slot_credit_id = sc.id and p.verification_status = 'pending_verification'))
    ) held on true
   where l.id = any (p_listing_ids)
     and cardinality(p_listing_ids) <= 100;
$function$;

-- Approval always starts a fresh 3-day hold, even for a request that waited longer than that for review.
CREATE OR REPLACE FUNCTION public.start_hold_on_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.verification_status = 'approved'
     and old.verification_status is distinct from 'approved' then
    update public.slot_credits sc
       set payment_deadline = now() + interval '3 days'
      from public.pod_members pm
     where pm.pod_id = new.id
       and pm.slot_credit_id = sc.id
       and sc.status in ('booked', 'booked_pending_claim')
;

    -- Keep any parent payment link aligned with the new deadline.
    update public.payment_links pl
       set expires_at = now() + interval '3 days'
      from public.pod_members pm
     where pm.pod_id = new.id
       and pm.slot_credit_id = pl.credit_id
       and pl.revoked_at is null;
  end if;
  return new;
end;
$function$;

-- Run the sweep every five minutes where pg_cron is available (hosted Supabase). Elsewhere the
-- lazy releases above still keep a student's own view right; call the function by hand to sweep.
do $cron$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron is not available here (%); schedule public.expire_lapsed_holds() yourself.', sqlerrm;
    return;
  end;
  begin
    perform cron.unschedule('expire-lapsed-holds');
  exception when others then
    null;
  end;
  perform cron.schedule('expire-lapsed-holds', '*/5 * * * *', 'select public.expire_lapsed_holds()');
exception when others then
  raise notice 'Could not schedule expire-lapsed-holds (%).', sqlerrm;
end
$cron$;
