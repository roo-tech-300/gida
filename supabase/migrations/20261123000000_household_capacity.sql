-- A listing has `units_available` identical units, and every household occupies one whole unit: a
-- solo "just me" reservation of a 3-person flat pays the full rent and takes the whole flat. Capacity
-- used to be counted per reservation, so a second household could be started on a one-unit listing
-- and a solo buyout showed spots still left.

-- A reservation holds a spot while it is not over, and its hold has not run out. (A request still
-- waiting for admin review keeps its spot: its hold has not started.)
create or replace function public.credit_holds_spot(p_status public.slot_credit_status, p_paid_at timestamptz, p_deadline timestamptz, p_credit_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select p_status not in ('expired', 'cancelled', 'rejected')
     and not (
       p_status in ('booked', 'booked_pending_claim') and p_paid_at is null and p_deadline < now()
       and not exists (select 1 from public.pod_members pm join public.pods p on p.id = pm.pod_id
                        where pm.slot_credit_id = p_credit_id and p.verification_status = 'pending_verification')
     );
$function$;

-- How many units of a listing are taken: households with at least one member who still holds a spot.
create or replace function public.households_in_use(p_listing_id uuid, p_except_pod uuid default null)
returns integer
language sql
stable
security definer
set search_path to 'public'
as $function$
  select count(*)::integer
    from public.pods p
   where p.listing_id = p_listing_id
     and (p_except_pod is null or p.id <> p_except_pod)
     and exists (
       select 1 from public.pod_members pm join public.slot_credits sc on sc.id = pm.slot_credit_id
        where pm.pod_id = p.id and public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id));
$function$;

-- Spots left = seats still open inside households that exist + every free unit's full capacity.
create or replace function public.get_spots_left(p_listing_ids uuid[])
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(jsonb_object_agg(l.id::text, greatest(0, (greatest(coalesce(l.units_available, 1) - h.live_households, 0) * t.tier) + h.open_seats)), '{}'::jsonb)
    from public.listings l
    cross join lateral (select greatest(1, coalesce(l.max_roommates, l.property_tier, 1)) as tier) t
    cross join lateral (
      select count(*)::integer as live_households, coalesce(sum(greatest(0, x.target - x.live)), 0)::integer as open_seats
        from (
          select p.id, coalesce(p.target_occupancy, p.property_tier) as target,
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

-- Starting a household needs a free unit. Checked when the household is created, and again when its
-- first member is added (two students can pass the first check at the same moment). One lock per
-- listing makes the second check reliable.
create or replace function public.assert_free_unit(p_listing_id uuid, p_except_pod uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_units integer;
begin
  if p_listing_id is null then
    return;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_listing_id::text, 0));
  select coalesce(units_available, 1) into v_units from public.listings where id = p_listing_id;
  if v_units is not null and public.households_in_use(p_listing_id, p_except_pod) >= v_units then
    raise exception 'This place is fully booked.' using errcode = 'P0001';
  end if;
end;
$function$;

create or replace function public.pods_capacity_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if public.is_student_caller() then
    perform public.assert_free_unit(new.listing_id, null);
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_pods_capacity_guard on public.pods;
create trigger trg_pods_capacity_guard
  before insert on public.pods
  for each row execute function public.pods_capacity_guard();

create or replace function public.pod_members_capacity_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_listing uuid;
begin
  if not public.is_student_caller() then
    return new;
  end if;
  select listing_id into v_listing from public.pods where id = new.pod_id;
  -- Joining a household that already has members never needs a free unit; founding (or reviving an empty one) does.
  if not exists (
    select 1 from public.pod_members pm join public.slot_credits sc on sc.id = pm.slot_credit_id
     where pm.pod_id = new.pod_id and pm.user_id <> new.user_id
       and public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id)
  ) then
    perform public.assert_free_unit(v_listing, new.pod_id);
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_pod_members_capacity_guard on public.pod_members;
create trigger trg_pod_members_capacity_guard
  before insert on public.pod_members
  for each row execute function public.pod_members_capacity_guard();
