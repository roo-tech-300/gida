-- Migration: Add pre-launch waitlist table
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint waitlist_email_key unique (email)
);

alter table public.waitlist enable row level security;

-- Anyone (including signed-out visitors on the coming-soon screen) can join
-- the waitlist, but nobody can read it back through the anon/authenticated
-- API — only the service role (dashboard, admin scripts) can list it.
drop policy if exists "Anyone can join the waitlist" on public.waitlist;
create policy "Anyone can join the waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Service role full access on waitlist" on public.waitlist;
create policy "Service role full access on waitlist"
  on public.waitlist
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists idx_waitlist_email on public.waitlist(email);
