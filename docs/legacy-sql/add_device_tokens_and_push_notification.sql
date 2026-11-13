-- ==============================================================================
-- Migration: Add Device Tokens and Push Notification Support
-- ==============================================================================

-- 1. Create device_tokens table
create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint device_tokens_user_platform_key unique (user_id, platform)
);

-- 2. Enable Row Level Security (RLS)
alter table public.device_tokens enable row level security;

-- 3. RLS Policies: Users can manage their own device tokens
drop policy if exists "Users can manage their own device tokens" on public.device_tokens;
create policy "Users can manage their own device tokens"
  on public.device_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Service role full access on device tokens" on public.device_tokens;
create policy "Service role full access on device tokens"
  on public.device_tokens
  for all
  to service_role
  using (true)
  with check (true);

-- 4. Indexes for fast lookup
create index if not exists idx_device_tokens_user_id on public.device_tokens(user_id);
create index if not exists idx_device_tokens_token on public.device_tokens(token);

-- 5. Helper function to get conversation recipient ID
create or replace function public.get_conversation_recipient(p_conversation_id uuid, p_sender_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_recipient_id uuid;
begin
  select
    case
      when participant_a = p_sender_id then participant_b
      else participant_a
    end
  into v_recipient_id
  from public.conversations
  where id = p_conversation_id;

  return v_recipient_id;
end;
$$;
