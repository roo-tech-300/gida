-- Students could write their own reservation and household rows directly, so they could mark
-- a reservation paid, pay less than the rent, stretch their own hold, or approve their own
-- household. The database now decides those fields; students keep only what they legitimately do.
-- Admins, the service role (the worker) and direct database sessions are unaffected.

create or replace function public.guard_slot_credit_writes()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_price numeric;
  v_limit integer;
  v_share numeric;
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

    -- The hold is the server's clock, not the phone's.
    new.payment_deadline := now() + interval '3 days';
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

drop trigger if exists trg_guard_slot_credit_writes on public.slot_credits;
create trigger trg_guard_slot_credit_writes
  before insert or update on public.slot_credits
  for each row execute function public.guard_slot_credit_writes();

create or replace function public.guard_pod_writes()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_student_caller() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Every household starts waiting for an admin, whatever the app sent.
    new.verification_status := 'pending_verification';
    new.verified_at := null;
    new.rejection_reason := null;
    new.physical_room_id := null;
    return new;
  end if;

  if new.verification_status is distinct from old.verification_status
     or new.verified_at is distinct from old.verified_at
     or new.rejection_reason is distinct from old.rejection_reason
     or new.physical_room_id is distinct from old.physical_room_id
     or new.matched_gender is distinct from old.matched_gender
     or new.founder_user_id is distinct from old.founder_user_id
     or new.listing_id is distinct from old.listing_id
     or new.estate_id is distinct from old.estate_id
     or new.group_code is distinct from old.group_code then
    raise exception 'Only an admin can change that part of a household.' using errcode = 'P0001';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_guard_pod_writes on public.pods;
create trigger trg_guard_pod_writes
  before insert or update on public.pods
  for each row execute function public.guard_pod_writes();
