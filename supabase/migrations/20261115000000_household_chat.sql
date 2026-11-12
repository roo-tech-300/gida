-- Household chat: one group chat per roommate group (pod), for the people who will share the place.
--
-- Access model
--   * Only active members of a pod can read or write its messages. "Active" means their reservation
--     is not expired and the pod was not rejected. Staff do not get access.
--   * Reads/writes go straight to household_messages under RLS; the inbox row (names, last message,
--     unread count) comes from get_household_chats() in one call.

create table public.household_messages (
  id uuid default gen_random_uuid() not null,
  pod_id uuid not null,
  sender_id uuid not null,
  body text not null,
  created_at timestamp with time zone default now() not null,
  constraint household_messages_pkey primary key (id),
  constraint household_messages_body_check check (char_length(btrim(body)) between 1 and 2000),
  constraint household_messages_pod_id_fkey foreign key (pod_id) references public.pods(id) on delete cascade,
  constraint household_messages_sender_id_fkey foreign key (sender_id) references auth.users(id) on delete cascade
);
create index household_messages_pod_created_idx on public.household_messages (pod_id, created_at desc);

create table public.household_reads (
  pod_id uuid not null,
  user_id uuid not null,
  last_read_at timestamp with time zone default now() not null,
  constraint household_reads_pkey primary key (pod_id, user_id),
  constraint household_reads_pod_id_fkey foreign key (pod_id) references public.pods(id) on delete cascade,
  constraint household_reads_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade
);

alter table public.household_messages enable row level security;
alter table public.household_reads enable row level security;

create or replace function public.is_household_member(p_pod_id uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select exists (
    select 1
      from public.pod_members pm
      join public.slot_credits sc on sc.id = pm.slot_credit_id
      join public.pods p on p.id = pm.pod_id
     where pm.pod_id = p_pod_id
       and pm.user_id = auth.uid()
       and sc.status <> 'expired'
       and p.verification_status <> 'rejected'
  );
$function$;

revoke all on function public.is_household_member(uuid) from public, anon;
grant execute on function public.is_household_member(uuid) to authenticated;

create policy "Household members read messages" on public.household_messages
  as permissive for select to authenticated
  using (public.is_household_member(pod_id));

create policy "Household members send messages" on public.household_messages
  as permissive for insert to authenticated
  with check (sender_id = auth.uid() and public.is_household_member(pod_id));

create policy "Members manage their own read marker" on public.household_reads
  as permissive for all to authenticated
  using (user_id = auth.uid() and public.is_household_member(pod_id))
  with check (user_id = auth.uid() and public.is_household_member(pod_id));

-- Marks a household thread as read for the caller.
create or replace function public.mark_household_read(p_pod_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if not public.is_household_member(p_pod_id) then
    raise exception 'You are not part of this household.' using errcode = '42501';
  end if;
  insert into public.household_reads (pod_id, user_id, last_read_at)
  values (p_pod_id, auth.uid(), now())
  on conflict (pod_id, user_id) do update set last_read_at = excluded.last_read_at;
end;
$function$;

revoke all on function public.mark_household_read(uuid) from public, anon;
grant execute on function public.mark_household_read(uuid) to authenticated;

-- The caller's household inbox rows. Only groups with at least two active members have a chat.
create or replace function public.get_household_chats()
 returns jsonb
 language plpgsql
 stable
 security definer
 set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(row_json order by sort_at desc), '[]'::jsonb)
    into v_result
    from (
      select
        coalesce(last.created_at, mine.joined_at) as sort_at,
        jsonb_build_object(
          'podId', mine.pod_id,
          'listingTitle', li.title,
          'memberCount', members.member_count,
          'memberIds', members.ids,
          'memberNames', members.names,
          'lastMessage', last.body,
          'lastMessageAt', last.created_at,
          'lastSenderId', last.sender_id,
          'lastSenderName', last.sender_name,
          'unreadCount', (
            select least(count(*), 99)
              from public.household_messages hm
             where hm.pod_id = mine.pod_id
               and hm.sender_id <> v_uid
               and hm.created_at > coalesce(
                     (select r.last_read_at from public.household_reads r
                       where r.pod_id = mine.pod_id and r.user_id = v_uid),
                     '-infinity'::timestamptz)
          )
        ) as row_json
      from (
        select pm.pod_id, pm.created_at as joined_at
          from public.pod_members pm
          join public.slot_credits sc on sc.id = pm.slot_credit_id
          join public.pods p on p.id = pm.pod_id
         where pm.user_id = v_uid
           and sc.status <> 'expired'
           and p.verification_status <> 'rejected'
      ) mine
      join public.pods pod on pod.id = mine.pod_id
      left join public.listings li on li.id = pod.listing_id
      cross join lateral (
        select count(*)::int as member_count,
               array_agg(pm2.user_id order by pm2.created_at) as ids,
               array_agg(split_part(btrim(coalesce(pr.full_name, 'Housemate')), ' ', 1) order by pm2.created_at) as names
          from public.pod_members pm2
          join public.slot_credits sc2 on sc2.id = pm2.slot_credit_id and sc2.status <> 'expired'
          left join public.profiles pr on pr.id = pm2.user_id
         where pm2.pod_id = mine.pod_id
      ) members
      left join lateral (
        select hm.body, hm.created_at, hm.sender_id,
               split_part(btrim(coalesce(sp.full_name, 'Housemate')), ' ', 1) as sender_name
          from public.household_messages hm
          left join public.profiles sp on sp.id = hm.sender_id
         where hm.pod_id = mine.pod_id
         order by hm.created_at desc
         limit 1
      ) last on true
      where members.member_count >= 2
    ) rows;

  return v_result;
end;
$function$;

revoke all on function public.get_household_chats() from public, anon;
grant execute on function public.get_household_chats() to authenticated;

alter publication supabase_realtime add table public.household_messages;
