-- Parent payment links: a student shares a link, a parent pays the reservation without an account.
--
-- Access model
--   * payment_links has RLS enabled and NO policies: nobody reads it through the Data API.
--   * Students create/reuse their link through create_payment_link() (owner-checked).
--   * The Cloudflare worker resolves a token through get_payment_link() using the service role.
--   * The link never outlives the hold: expires_at always equals the credit's payment_deadline.

create table public.payment_links (
  id uuid default gen_random_uuid() not null,
  credit_id uuid not null,
  token text not null,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone not null,
  revoked_at timestamp with time zone,
  constraint payment_links_pkey primary key (id),
  constraint payment_links_token_key unique (token),
  constraint payment_links_credit_id_fkey foreign key (credit_id) references public.slot_credits(id) on delete cascade,
  constraint payment_links_created_by_fkey foreign key (created_by) references auth.users(id) on delete cascade
);

-- One live link per reservation; re-sharing returns the same link.
create unique index payment_links_one_live_per_credit on public.payment_links (credit_id) where revoked_at is null;

alter table public.payment_links enable row level security;
revoke all on public.payment_links from anon, authenticated;

-- Student side ---------------------------------------------------------------------------------

create or replace function public.create_payment_link(p_credit_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_credit record;
  v_pod_status text;
  v_link record;
begin
  if v_uid is null then
    raise exception 'You must be signed in.' using errcode = '42501';
  end if;

  select id, user_id, status, amount_paid, payment_deadline
    into v_credit
    from public.slot_credits
   where id = p_credit_id;

  if not found or v_credit.user_id is distinct from v_uid then
    raise exception 'Reservation not found.' using errcode = 'P0002';
  end if;
  if v_credit.status not in ('booked', 'booked_pending_claim') then
    raise exception 'This reservation is not waiting for payment.' using errcode = 'P0001';
  end if;
  if v_credit.payment_deadline <= now() then
    raise exception 'The hold on this reservation has ended.' using errcode = 'P0001';
  end if;
  if coalesce(v_credit.amount_paid, 0) <= 0 then
    raise exception 'This reservation has no amount to pay yet.' using errcode = 'P0001';
  end if;

  select p.verification_status::text
    into v_pod_status
    from public.pod_members pm
    join public.pods p on p.id = pm.pod_id
   where pm.slot_credit_id = p_credit_id
   limit 1;
  if v_pod_status in ('pending_verification', 'rejected') then
    raise exception 'Gida has not approved this request yet.' using errcode = 'P0001';
  end if;

  select * into v_link
    from public.payment_links
   where credit_id = p_credit_id and revoked_at is null;

  if found then
    -- Keep the link aligned with the hold deadline (the deadline can move).
    update public.payment_links
       set expires_at = v_credit.payment_deadline
     where id = v_link.id
    returning * into v_link;
  else
    insert into public.payment_links (credit_id, token, created_by, expires_at)
    values (p_credit_id, replace(gen_random_uuid()::text, '-', ''), v_uid, v_credit.payment_deadline)
    returning * into v_link;
  end if;

  return jsonb_build_object('token', v_link.token, 'expires_at', v_link.expires_at);
end;
$function$;

revoke all on function public.create_payment_link(uuid) from public, anon;
grant execute on function public.create_payment_link(uuid) to authenticated;

-- Worker side (service role only) --------------------------------------------------------------

-- Returns only what the parent's page needs. status is one of: open, paid, expired, not_ready, not_found.
create or replace function public.get_payment_link(p_token text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_row record;
  v_pod_status text;
  v_status text;
begin
  select l.expires_at, l.revoked_at,
         c.id as credit_id, c.user_id, c.listing_id, c.status as credit_status,
         c.amount_paid, c.payment_deadline, c.target_occupancy,
         li.title, li.location_landmark,
         split_part(btrim(coalesce(pr.full_name, '')), ' ', 1) as first_name
    into v_row
    from public.payment_links l
    join public.slot_credits c on c.id = l.credit_id
    left join public.listings li on li.id = c.listing_id
    left join public.profiles pr on pr.id = c.user_id
   where l.token = p_token;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  select p.verification_status::text
    into v_pod_status
    from public.pod_members pm
    join public.pods p on p.id = pm.pod_id
   where pm.slot_credit_id = v_row.credit_id
   limit 1;

  v_status := case
    when v_row.credit_status in ('paid_unmatched', 'matched', 'subletting') then 'paid'
    when v_row.revoked_at is not null
      or v_row.credit_status = 'expired'
      or v_row.expires_at <= now()
      or v_row.payment_deadline <= now() then 'expired'
    when v_pod_status in ('pending_verification', 'rejected') then 'not_ready'
    else 'open'
  end;

  return jsonb_build_object(
    'status', v_status,
    'credit_id', v_row.credit_id,
    'student_id', v_row.user_id,
    'listing_id', v_row.listing_id,
    'listing_title', v_row.title,
    'location', v_row.location_landmark,
    'student_first_name', nullif(v_row.first_name, ''),
    'amount', v_row.amount_paid,
    'deadline', v_row.payment_deadline,
    'target_occupancy', v_row.target_occupancy
  );
end;
$function$;

revoke all on function public.get_payment_link(text) from public, anon, authenticated;
grant execute on function public.get_payment_link(text) to service_role;
