-- Rent is rounded UP so it splits into whole naira for every household size a listing allows.
-- A student picks a household of 1 to N people, and each pays rent / size, so the rent must divide
-- evenly by every size from 1 to N: the least common multiple (12 for 4 people, 6 for 3, 60 for 6).
-- Prices are only ever raised, never lowered. Existing rows are left alone; they are re-rounded the
-- next time their price or room limit is saved.

create or replace function public.rent_split_unit(p_max_people integer)
returns bigint
language plpgsql
immutable
as $function$
declare
  v_unit bigint := 1;
  v_size integer;
begin
  for v_size in 2..least(greatest(coalesce(p_max_people, 1), 1), 10) loop
    v_unit := v_unit / gcd(v_unit, v_size) * v_size;
  end loop;
  return v_unit;
end;
$function$;

create or replace function public.round_rent_up(p_price numeric, p_max_people integer)
returns numeric
language sql
immutable
as $function$
  select case
    when p_price is null or p_price <= 0 then p_price
    else ceil(p_price / public.rent_split_unit(p_max_people)) * public.rent_split_unit(p_max_people)
  end;
$function$;

create or replace function public.listings_round_rent_up()
returns trigger
language plpgsql
as $function$
begin
  new.price_amount := public.round_rent_up(new.price_amount, coalesce(new.max_roommates, new.property_tier, 1));
  return new;
end;
$function$;

drop trigger if exists trg_listings_round_rent_up on public.listings;
create trigger trg_listings_round_rent_up
  before insert or update of price_amount, max_roommates, property_tier on public.listings
  for each row execute function public.listings_round_rent_up();

create or replace function public.estates_round_rent_up()
returns trigger
language plpgsql
as $function$
begin
  new.price_per_annum := public.round_rent_up(new.price_per_annum, new.property_tier);
  return new;
end;
$function$;

drop trigger if exists trg_estates_round_rent_up on public.estates;
create trigger trg_estates_round_rent_up
  before insert or update of price_per_annum, property_tier on public.estates
  for each row execute function public.estates_round_rent_up();
