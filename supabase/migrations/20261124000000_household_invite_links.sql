-- Invite LINKS for friends, with seats held for a short window.
--  * A founder creates a one-use link. It holds a seat for 2 hours (a "ghost seat"), then the seat is
--    released while the link keeps working until it expires (48 hours) or the seat is taken.
--  * A friend who joins by link (or by code) has 24 hours to pay.
--  * A student holds one unpaid spot at a time, and two lapsed holds pause new reservations for a day.
-- Links stop working when their founder cancels or lapses, or the household is rejected.

create table if not exists public.household_invites (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pods(id) on delete cascade,
  token text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  seat_held_until timestamptz not null,
  expires_at timestamptz not null,
  opened_at timestamptz,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  revoked_at timestamptz
);
create index if not exists household_invites_pod_idx on public.household_invites (pod_id);

alter table public.household_invites enable row level security;
drop policy if exists household_invites_select_own on public.household_invites;
create policy household_invites_select_own on public.household_invites for select using (created_by = auth.uid());
revoke insert, update, delete on public.household_invites from anon, authenticated;

-- Seats held for friends who were sent a link and have not joined yet.
create or replace function public.pod_ghost_seats(p_pod_id uuid, p_except_invite uuid)
returns integer
language sql
stable
security definer
set search_path to 'public'
as $function$
  select count(*)::integer from public.household_invites i
   where i.pod_id = p_pod_id and i.claimed_at is null and i.revoked_at is null
     and i.seat_held_until > now() and i.expires_at > now()
     and (p_except_invite is null or i.id <> p_except_invite);
$function$;

CREATE OR REPLACE FUNCTION public._join_household(p_pod_id uuid, p_user_id uuid, p_invite uuid DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := p_user_id;
  v_ghosts INTEGER;
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
  SELECT * INTO v_pod FROM pods WHERE id = p_pod_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This household no longer exists.';
  END IF;
  IF v_pod.verification_status = 'rejected' THEN
    RAISE EXCEPTION 'This household is no longer open.';
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

  -- Seats held for friends who were sent a link count as taken, except the one this link holds.
  v_ghosts := public.pod_ghost_seats(v_pod.id, p_invite);
  IF v_active + v_ghosts >= v_target THEN
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
  v_deadline := NOW() + INTERVAL '24 hours';

  -- Mirror generateInviteCode(): GIDA-POD- + 12 chars (no I/O/0/1 lookalikes).
  v_invite_code := 'GIDA-POD-';
  FOR v_i IN 1..12 LOOP
    v_invite_code := v_invite_code || SUBSTRING(
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' FROM FLOOR(RANDOM() * 32)::INT + 1 FOR 1
    );
  END LOOP;

  -- A friend's seat is held for 24 hours (the credit guard reads this; it can only ever shorten the hold).
  PERFORM set_config('app.seat_hold_hours', '24', true);
  INSERT INTO slot_credits (
    user_id, estate_id, listing_id, property_tier, intent_size, target_occupancy,
    status, invite_code, payment_deadline, amount_paid
  ) VALUES (
    v_user_id, v_pod.estate_id, v_pod.listing_id, v_pod.property_tier, 1, v_target,
    'booked_pending_claim', v_invite_code, v_deadline, v_share
  ) RETURNING id INTO v_credit_id;
  PERFORM set_config('app.seat_hold_hours', '', true);

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

CREATE OR REPLACE FUNCTION public.join_pod(p_group_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pod_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Please sign in to continue.';
  END IF;
  SELECT id INTO v_pod_id FROM pods WHERE group_code = UPPER(BTRIM(p_group_code));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite code not found. Ask your friend to share their invite code.';
  END IF;
  RETURN public._join_household(v_pod_id, auth.uid(), NULL);
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.get_spots_left(p_listing_ids uuid[])
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(jsonb_object_agg(l.id::text, greatest(0, (greatest(coalesce(l.units_available, 1) - h.live_households, 0) * t.tier) + h.open_seats)), '{}'::jsonb)
    from public.listings l
    cross join lateral (select greatest(1, coalesce(l.max_roommates, l.property_tier, 1)) as tier) t
    cross join lateral (
      select count(*)::integer as live_households, coalesce(sum(greatest(0, x.target - x.live - x.ghosts)), 0)::integer as open_seats
        from (
          select p.id, coalesce(p.target_occupancy, p.property_tier) as target, public.pod_ghost_seats(p.id, null) as ghosts,
                 coalesce(sum(pm.intent_size) filter (where public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id)), 0) as live
            from public.pods p
            join public.pod_members pm on pm.pod_id = p.id
            join public.slot_credits sc on sc.id = pm.slot_credit_id
           where p.listing_id = l.id
           group by p.id
          having count(*) filter (where public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id)) > 0
        ) x
    ) h
   where l.id = any (p_listing_ids)
     and cardinality(p_listing_ids) <= 100;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_reservation(p_credit_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  if v_credit.status in ('expired', 'cancelled', 'rejected') then
    return jsonb_build_object('success', true, 'already_ended', true);
  end if;

  if v_credit.status not in ('booked', 'booked_pending_claim') or v_credit.paid_at is not null then
    raise exception 'ALREADY_PAID' using errcode = 'P0001';
  end if;

  update public.slot_credits
     set status = 'cancelled', cancelled_at = now()
   where id = p_credit_id;

  update public.household_invites set revoked_at = now()
   where created_by = v_uid and claimed_at is null and revoked_at is null;

  perform public.reconcile_pod_after_credit_expiry(p_credit_id);

  return jsonb_build_object('success', true, 'already_ended', false);
end;
$function$;

CREATE OR REPLACE FUNCTION public.release_spots_on_rejection()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.verification_status = 'rejected' and old.verification_status is distinct from 'rejected' then
    -- Only unpaid reservations: a paid one needs a refund decision, not an automatic release.
    update public.slot_credits sc
       set status = 'rejected', rejected_at = now()
      from public.pod_members pm
     where pm.pod_id = new.id
       and pm.slot_credit_id = sc.id
       and sc.status in ('booked', 'booked_pending_claim')
       and sc.paid_at is null;

    update public.pods p
       set current_total_intent = coalesce((
             select sum(pm.intent_size)
               from public.pod_members pm
               join public.slot_credits sc on sc.id = pm.slot_credit_id
              where pm.pod_id = p.id
                and sc.status not in ('expired', 'cancelled', 'rejected')
           ), 0),
           is_finalized = false
     where p.id = new.id;

    -- A parent pay link for a rejected request must stop working.
    update public.payment_links pl
       set revoked_at = now()
      from public.pod_members pm
     where pm.pod_id = new.id
       and pm.slot_credit_id = pl.credit_id
       and pl.revoked_at is null;

    update public.household_invites set revoked_at = now() where pod_id = new.id and claimed_at is null and revoked_at is null;
    update public.pod_invitations set status = 'declined' where pod_id = new.id and status = 'pending';
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

create or replace function public.create_household_invite(p_pod_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_pod public.pods%rowtype;
  v_live integer;
  v_target integer;
  v_recent integer;
  v_row public.household_invites%rowtype;
begin
  if v_uid is null then
    raise exception 'Please sign in to continue.';
  end if;
  select * into v_pod from public.pods where id = p_pod_id for update;
  if not found then
    raise exception 'This household no longer exists.';
  end if;
  if not exists (
    select 1 from public.pod_members pm join public.slot_credits sc on sc.id = pm.slot_credit_id
     where pm.pod_id = p_pod_id and pm.user_id = v_uid
       and public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id)
  ) then
    raise exception 'Only a member of this household can invite friends.';
  end if;
  if v_pod.verification_status = 'rejected' then
    raise exception 'This household is no longer open.';
  end if;

  v_target := coalesce(v_pod.target_occupancy, v_pod.property_tier);
  select coalesce(sum(pm.intent_size), 0) into v_live
    from public.pod_members pm join public.slot_credits sc on sc.id = pm.slot_credit_id
   where pm.pod_id = p_pod_id and public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id);
  if v_live + public.pod_ghost_seats(p_pod_id, null) >= v_target then
    raise exception 'Every seat is taken or already held for a friend. Try again in a couple of hours.';
  end if;

  -- A founder cannot keep a seat held by issuing a fresh link every two hours.
  select count(*) into v_recent from public.household_invites where pod_id = p_pod_id and created_at > now() - interval '24 hours';
  if v_recent >= greatest(2 * (v_target - 1), 2) then
    raise exception 'You have sent a lot of invites today. Share one of your existing links instead.';
  end if;

  insert into public.household_invites (pod_id, token, created_by, seat_held_until, expires_at)
  values (p_pod_id, replace(gen_random_uuid()::text, '-', ''), v_uid, now() + interval '2 hours', now() + interval '48 hours')
  returning * into v_row;

  return jsonb_build_object('id', v_row.id, 'token', v_row.token, 'seatHeldUntil', v_row.seat_held_until, 'expiresAt', v_row.expires_at);
end;
$function$;

create or replace function public.revoke_household_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update public.household_invites set revoked_at = now()
   where id = p_invite_id and created_by = auth.uid() and claimed_at is null and revoked_at is null;
end;
$function$;

-- What the public invite page shows. Safe to call without an account: the token is the secret.
create or replace function public.get_household_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  i public.household_invites%rowtype;
  p public.pods%rowtype;
  l public.listings%rowtype;
  v_live integer;
  v_ghosts integer;
  v_target integer;
  v_share numeric;
  v_status text;
  v_members jsonb;
  v_inviter text;
begin
  select * into i from public.household_invites where token = p_token;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  select * into p from public.pods where id = i.pod_id;
  select * into l from public.listings where id = p.listing_id;
  v_target := coalesce(p.target_occupancy, p.property_tier);

  select coalesce(sum(pm.intent_size), 0) into v_live
    from public.pod_members pm join public.slot_credits sc on sc.id = pm.slot_credit_id
   where pm.pod_id = p.id and public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id);
  v_ghosts := public.pod_ghost_seats(p.id, i.id);

  select sc.amount_paid into v_share
    from public.pod_members pm join public.slot_credits sc on sc.id = pm.slot_credit_id
   where pm.pod_id = p.id and public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id) and sc.amount_paid > 0
   order by sc.created_at limit 1;
  v_share := coalesce(v_share, round(l.price_amount / nullif(v_target, 0), 2));

  v_status := case
    when i.revoked_at is not null then 'revoked'
    when i.claimed_at is not null then 'claimed'
    when i.expires_at <= now() then 'expired'
    when p.verification_status = 'rejected' or v_live = 0 then 'closed'
    when v_live + v_ghosts >= v_target then 'full'
    else 'open'
  end;

  if i.opened_at is null then
    update public.household_invites set opened_at = now() where id = i.id;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('initials', upper(left(coalesce(pr.full_name, '?'), 1) || coalesce(left(split_part(btrim(coalesce(pr.full_name, '')), ' ', 2), 1), ''))) order by pm.created_at), '[]'::jsonb)
    into v_members
    from public.pod_members pm join public.slot_credits sc on sc.id = pm.slot_credit_id left join public.profiles pr on pr.id = pm.user_id
   where pm.pod_id = p.id and public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id);
  select split_part(btrim(coalesce(full_name, '')), ' ', 1) into v_inviter from public.profiles where id = i.created_by;

  return jsonb_build_object(
    'status', v_status, 'listingId', l.id, 'title', l.title, 'location', concat_ws(', ', l.location_landmark, l.city), 'image', l.primary_image,
    'rent', l.price_amount, 'share', v_share, 'target', v_target, 'joined', v_live,
    'openSeats', greatest(0, v_target - v_live - v_ghosts), 'gender', p.matched_gender::text,
    'inviter', nullif(v_inviter, ''), 'members', v_members, 'seatHeldUntil', i.seat_held_until, 'expiresAt', i.expires_at
  );
end;
$function$;

create or replace function public.join_household_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  i public.household_invites%rowtype;
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'Please sign in to continue.';
  end if;
  select * into i from public.household_invites where token = p_token for update;
  if not found then
    raise exception 'This invite link is not valid.';
  end if;
  -- Refreshing the page after joining returns the same reservation instead of an error.
  if i.claimed_by = v_uid then
    return jsonb_build_object('creditId', (select pm.slot_credit_id from public.pod_members pm where pm.pod_id = i.pod_id and pm.user_id = v_uid), 'podId', i.pod_id, 'alreadyJoined', true);
  end if;
  if i.revoked_at is not null then raise exception 'This invite was cancelled.'; end if;
  if i.claimed_at is not null then raise exception 'This invite has already been used.'; end if;
  if i.expires_at <= now() then raise exception 'This invite has expired.'; end if;
  if i.created_by = v_uid then raise exception 'This is your own invite link.'; end if;

  v_result := public._join_household(i.pod_id, v_uid, i.id);
  update public.household_invites set claimed_by = v_uid, claimed_at = now() where id = i.id;
  return v_result;
end;
$function$;

-- The founder's seat list: who is in (and whether they have paid), and which links are out.
create or replace function public.get_household_seats(p_pod_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_pod public.pods%rowtype;
  v_members jsonb;
  v_invites jsonb;
begin
  select * into v_pod from public.pods where id = p_pod_id;
  if not found or v_uid is null or not exists (
    select 1 from public.pod_members pm join public.slot_credits sc on sc.id = pm.slot_credit_id
     where pm.pod_id = p_pod_id and pm.user_id = v_uid and public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id)
  ) then
    raise exception 'Only a member of this household can see its seats.';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'name', coalesce(pr.full_name, 'A housemate'), 'isYou', pm.user_id = v_uid,
      'state', case when sc.status in ('paid_unmatched', 'matched', 'subletting') then 'paid' when v_pod.verification_status = 'pending_verification' then 'review' else 'unpaid' end,
      'deadline', sc.payment_deadline) order by pm.created_at), '[]'::jsonb)
    into v_members
    from public.pod_members pm join public.slot_credits sc on sc.id = pm.slot_credit_id left join public.profiles pr on pr.id = pm.user_id
   where pm.pod_id = p_pod_id and public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id);

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', i.id, 'token', i.token, 'openedAt', i.opened_at, 'seatHeldUntil', i.seat_held_until,
      'held', i.seat_held_until > now(), 'expiresAt', i.expires_at) order by i.created_at), '[]'::jsonb)
    into v_invites
    from public.household_invites i
   where i.pod_id = p_pod_id and i.created_by = v_uid and i.claimed_at is null and i.revoked_at is null and i.expires_at > now();

  return jsonb_build_object('target', coalesce(v_pod.target_occupancy, v_pod.property_tier), 'members', v_members, 'invites', v_invites);
end;
$function$;

revoke all on function public.pod_ghost_seats(uuid, uuid) from public, anon, authenticated;
revoke all on function public._join_household(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.create_household_invite(uuid) from public, anon;
revoke all on function public.revoke_household_invite(uuid) from public, anon;
revoke all on function public.join_household_invite(text) from public, anon;
revoke all on function public.get_household_seats(uuid) from public, anon;
grant execute on function public.create_household_invite(uuid) to authenticated;
grant execute on function public.revoke_household_invite(uuid) to authenticated;
grant execute on function public.join_household_invite(text) to authenticated;
grant execute on function public.get_household_seats(uuid) to authenticated;
grant execute on function public.get_household_invite(text) to anon, authenticated;
