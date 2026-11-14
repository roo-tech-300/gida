-- The "join an open group" list used to count every membership row, including people whose spot had
-- ended (cancelled, lapsed or rejected), and knew nothing about seats held for a friend's invite link.
-- This returns the truth for each household: who still holds a seat, and how many seats links hold.
create or replace function public.get_pod_seat_counts(p_pod_ids uuid[])
returns table (pod_id uuid, live_user_ids uuid[], held integer)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select p.id,
         coalesce(array_agg(pm.user_id) filter (where public.credit_holds_spot(sc.status, sc.paid_at, sc.payment_deadline, sc.id)), '{}'::uuid[]),
         public.pod_ghost_seats(p.id, null)
    from public.pods p
    left join public.pod_members pm on pm.pod_id = p.id
    left join public.slot_credits sc on sc.id = pm.slot_credit_id
   where p.id = any (p_pod_ids) and cardinality(p_pod_ids) <= 100
   group by p.id;
$function$;

revoke all on function public.get_pod_seat_counts(uuid[]) from public, anon;
grant execute on function public.get_pod_seat_counts(uuid[]) to authenticated;
