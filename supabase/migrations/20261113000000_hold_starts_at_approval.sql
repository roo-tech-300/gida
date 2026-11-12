-- The payment hold starts when Gida approves the request, not when the student applies.
--
-- Before: slot_credits.payment_deadline = request time + 3 days. A slow review ate the student's
-- time to pay. After: approving a pod gives every unpaid member a fresh 3 days from that moment.
-- Requests that nobody reviews still lapse 3 days after they were made (the existing expiry job).

create or replace function public.start_hold_on_approval()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if new.verification_status = 'approved'
     and old.verification_status is distinct from 'approved' then
    update public.slot_credits sc
       set payment_deadline = now() + interval '3 days'
      from public.pod_members pm
     where pm.pod_id = new.id
       and pm.slot_credit_id = sc.id
       and sc.status in ('booked', 'booked_pending_claim')
       and sc.payment_deadline > now();

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

drop trigger if exists pods_start_hold_on_approval on public.pods;
create trigger pods_start_hold_on_approval
  after update of verification_status on public.pods
  for each row execute function public.start_hold_on_approval();
