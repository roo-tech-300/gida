-- One Support thread per student.
--
-- A student's chats with staff all live in one conversation with the "support admin". Every other
-- admin can read and answer those threads (a shared inbox), so nobody waits on one person.
--   * admin_profiles.is_support marks the support admin. Without a mark, the earliest super_admin is used.
--   * Staff can read/write conversations that include the support admin, even if they are not a participant.

alter table public.admin_profiles add column if not exists is_support boolean not null default false;

create or replace function public.get_support_admin_id()
 returns uuid
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select id from public.admin_profiles
   order by is_support desc, (role = 'super_admin') desc, id asc
   limit 1;
$function$;

revoke all on function public.get_support_admin_id() from public, anon;
grant execute on function public.get_support_admin_id() to authenticated, service_role;

-- True when the caller is staff and the conversation involves the support admin.
create or replace function public.staff_can_use_conversation(p_conversation_id uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select public.get_admin_role(auth.uid()) is not null
     and exists (
       select 1 from public.conversations c
        where c.id = p_conversation_id
          and public.get_support_admin_id() in (c.participant_a, c.participant_b)
     );
$function$;

revoke all on function public.staff_can_use_conversation(uuid) from public, anon;
grant execute on function public.staff_can_use_conversation(uuid) to authenticated;

create policy "Staff can read support conversations" on public.conversations
  as permissive for select to authenticated
  using (public.get_admin_role(auth.uid()) is not null
         and public.get_support_admin_id() in (participant_a, participant_b));

create policy "Staff can create support conversations" on public.conversations
  as permissive for insert to authenticated
  with check (public.get_admin_role(auth.uid()) is not null
              and public.get_support_admin_id() in (participant_a, participant_b));

create policy "Staff can update support conversations" on public.conversations
  as permissive for update to authenticated
  using (public.get_admin_role(auth.uid()) is not null
         and public.get_support_admin_id() in (participant_a, participant_b))
  with check (public.get_admin_role(auth.uid()) is not null
              and public.get_support_admin_id() in (participant_a, participant_b));

create policy "Staff can read support messages" on public.messages
  as permissive for select to authenticated
  using (public.staff_can_use_conversation(conversation_id));

create policy "Staff can send support messages" on public.messages
  as permissive for insert to authenticated
  with check (auth.uid() = sender_id and public.staff_can_use_conversation(conversation_id));

-- Unread goes to the other side. A staff member who is not a participant answers for the support admin,
-- so the unread badge belongs to the participant who is not staff.
create or replace function public.bump_conversation_on_message()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_conv record;
  v_preview text := coalesce(nullif(trim(new.body), ''), 'Shared a listing');
  v_unread_to_a boolean;
begin
  select participant_a, participant_b into v_conv
    from public.conversations where id = new.conversation_id;
  if not found then
    return new;
  end if;

  if v_conv.participant_a = new.sender_id then
    v_unread_to_a := false;
  elsif v_conv.participant_b = new.sender_id then
    v_unread_to_a := true;
  else
    -- Non-participant staff reply: notify the participant who is not staff.
    v_unread_to_a := not exists (select 1 from public.admin_profiles where id = v_conv.participant_a);
  end if;

  update public.conversations
     set last_message_at = to_timestamp(new.client_sent_at / 1000.0),
         last_message_preview = v_preview,
         last_message_sender_id = new.sender_id,
         unread_a = unread_a + case when v_unread_to_a then 1 else 0 end,
         unread_b = unread_b + case when v_unread_to_a then 0 else 1 end
   where id = new.conversation_id;

  return new;
end;
$function$;

create or replace function public.mark_conversation_read(p_conversation_id uuid, p_reader_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_staff_reader boolean := false;
begin
  if not exists (
    select 1 from public.conversations
     where id = p_conversation_id
       and (participant_a = p_reader_id or participant_b = p_reader_id)
  ) then
    -- Staff reading a support thread they are not part of: allowed, clears the support admin's badge.
    v_staff_reader := p_reader_id = auth.uid()
      and public.get_admin_role(p_reader_id) is not null
      and public.staff_can_use_conversation(p_conversation_id);
    if not v_staff_reader then
      raise exception 'READER_NOT_A_PARTICIPANT' using errcode = '22023';
    end if;
  end if;

  update public.messages
     set read_at = now()
   where conversation_id = p_conversation_id
     and sender_id <> p_reader_id
     and read_at is null;

  update public.conversations
     set unread_a = case when participant_a = p_reader_id
                           or (v_staff_reader and participant_a = public.get_support_admin_id())
                         then 0 else unread_a end,
         unread_b = case when participant_b = p_reader_id
                           or (v_staff_reader and participant_b = public.get_support_admin_id())
                         then 0 else unread_b end
   where id = p_conversation_id;
end;
$function$;
