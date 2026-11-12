-- One-off: fold each student's existing chats with individual admins into their single Support thread.
-- Safe to re-run: once merged there is nothing left to move. Chats between students, and between
-- two staff members, are not touched. Messages keep their sender, timestamps and attachments.

do $merge$
declare
  v_support uuid := public.get_support_admin_id();
  v_student uuid;
  v_target uuid;
  v_old record;
  v_a uuid;
  v_b uuid;
begin
  if v_support is null then
    return;
  end if;

  for v_student in
    select distinct case when c.participant_a = s.id then c.participant_b else c.participant_a end
      from public.conversations c
      join public.admin_profiles s on s.id in (c.participant_a, c.participant_b)
     where s.id <> v_support
       and not exists (
         select 1 from public.admin_profiles o
          where o.id = case when c.participant_a = s.id then c.participant_b else c.participant_a end
       )
  loop
    v_a := least(v_student, v_support);
    v_b := greatest(v_student, v_support);

    insert into public.conversations (participant_a, participant_b)
    values (v_a, v_b)
    on conflict (participant_a, participant_b) do nothing;

    select id into v_target from public.conversations
     where participant_a = v_a and participant_b = v_b;

    for v_old in
      select c.id
        from public.conversations c
        join public.admin_profiles s on s.id in (c.participant_a, c.participant_b)
       where v_student in (c.participant_a, c.participant_b)
         and s.id <> v_support
         and c.id <> v_target
    loop
      update public.messages set conversation_id = v_target where conversation_id = v_old.id;
      delete from public.conversations where id = v_old.id;
    end loop;

    -- Rebuild the summary and unread counters from the merged messages.
    update public.conversations c
       set last_message_at = last.sent_at,
           last_message_preview = last.preview,
           last_message_sender_id = last.sender_id,
           unread_a = (select count(*) from public.messages m
                        where m.conversation_id = c.id and m.read_at is null
                          and m.sender_id is distinct from c.participant_a
                          and (c.participant_a = v_student or m.sender_id = v_student)),
           unread_b = (select count(*) from public.messages m
                        where m.conversation_id = c.id and m.read_at is null
                          and m.sender_id is distinct from c.participant_b
                          and (c.participant_b = v_student or m.sender_id = v_student))
      from (
        select to_timestamp(m.client_sent_at / 1000.0) as sent_at,
               coalesce(nullif(trim(m.body), ''), 'Shared a listing') as preview,
               m.sender_id
          from public.messages m
         where m.conversation_id = v_target
         order by m.client_sent_at desc
         limit 1
      ) last
     where c.id = v_target;
  end loop;
end
$merge$;
