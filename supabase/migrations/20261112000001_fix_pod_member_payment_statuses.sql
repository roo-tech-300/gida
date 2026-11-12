-- The original function failed on every call with: column reference "pod_id" is ambiguous.
-- RETURNS TABLE(pod_id ...) declares a PL/pgSQL variable named pod_id, which clashed with the
-- unqualified column in the sub-select. Qualifying it fixes the household payment status lookup.
create or replace function public.get_pod_member_payment_statuses(p_pod_ids uuid[])
 returns table(pod_id uuid, user_id uuid, slot_credit_id uuid, status text)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  return query (
    select pm.pod_id, pm.user_id, pm.slot_credit_id, sc.status::text
      from public.pod_members pm
      join public.slot_credits sc on sc.id = pm.slot_credit_id
     where pm.pod_id = any(p_pod_ids)
       and pm.pod_id in (select mine.pod_id from public.pod_members mine where mine.user_id = auth.uid())
  );
end;
$function$;
