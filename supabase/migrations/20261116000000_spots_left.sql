-- Spots left per listing, for the Discover cards.
-- spots_left = total spots - spots held by reservations that have not expired.
-- slot_credits is private (RLS), so this security-definer function exposes counts only.

create or replace function public.get_spots_left(p_listing_ids uuid[])
 returns jsonb
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select coalesce(jsonb_object_agg(l.id::text, greatest(0, spots.total - coalesce(held.n, 0))), '{}'::jsonb)
    from public.listings l
    cross join lateral (
      select coalesce(l.abstract_slots_available,
                      coalesce(l.units_available, 1) * greatest(1, coalesce(l.property_tier, l.max_roommates, 1))) as total
    ) spots
    left join lateral (
      select count(*)::int as n
        from public.slot_credits sc
       where sc.listing_id = l.id and sc.status <> 'expired'
    ) held on true
   where l.id = any (p_listing_ids)
     and cardinality(p_listing_ids) <= 100;
$function$;

revoke all on function public.get_spots_left(uuid[]) from public, anon;
grant execute on function public.get_spots_left(uuid[]) to authenticated;
