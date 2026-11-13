-- Point saved image URLs at the Cloudflare image Worker (free CDN) instead of Supabase Storage.
--
-- Why: every image view served by Supabase counts against the project's egress quota.
-- The Worker (worker-images/) caches each photo, so repeat views never reach Supabase.
--
-- Safe by design:
--  * Only absolute https://<ref>.supabase.co/storage/v1/object/public/<bucket>/... URLs are touched,
--    so local-dev data (http://127.0.0.1:54321/...) and anything else stays as is.
--  * Old app builds keep working: the original Supabase URLs still resolve.
--  * Every changed value is saved in public.image_url_rewrite_backup.
--    Undo with supabase/rollbacks/20261117000000_image_cdn_urls.down.sql.
--  * set_listings_updated_at is paused so this does not reorder feeds sorted by updated_at.

create table if not exists public.image_url_rewrite_backup (
  table_name  text        not null,
  row_id      uuid        not null,
  column_name text        not null,
  old_value   text        not null,
  created_at  timestamptz not null default now(),
  primary key (table_name, row_id, column_name)
);

-- Internal bookkeeping: no policies, so only the service role / postgres can read it.
alter table public.image_url_rewrite_backup enable row level security;

alter table public.listings disable trigger set_listings_updated_at;

do $$
declare
  old_pattern constant text := '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/(listing-images|place-photos|avatars)/';
  new_prefix  constant text := 'https://gida-images.gidamedia.workers.dev/\1/';
begin
  insert into public.image_url_rewrite_backup (table_name, row_id, column_name, old_value)
    select 'listings', id, 'primary_image', primary_image from public.listings where primary_image ~ old_pattern
    on conflict do nothing;
  update public.listings set primary_image = regexp_replace(primary_image, old_pattern, new_prefix)
    where primary_image ~ old_pattern;

  insert into public.image_url_rewrite_backup (table_name, row_id, column_name, old_value)
    select 'listing_photos', id, 'image_url', image_url from public.listing_photos where image_url ~ old_pattern
    on conflict do nothing;
  update public.listing_photos set image_url = regexp_replace(image_url, old_pattern, new_prefix)
    where image_url ~ old_pattern;

  insert into public.image_url_rewrite_backup (table_name, row_id, column_name, old_value)
    select 'profiles', id, 'avatar_url', avatar_url from public.profiles where avatar_url ~ old_pattern
    on conflict do nothing;
  update public.profiles set avatar_url = regexp_replace(avatar_url, old_pattern, new_prefix)
    where avatar_url ~ old_pattern;

  insert into public.image_url_rewrite_backup (table_name, row_id, column_name, old_value)
    select 'estates', id, 'primary_image', primary_image from public.estates where primary_image ~ old_pattern
    on conflict do nothing;
  update public.estates set primary_image = regexp_replace(primary_image, old_pattern, new_prefix)
    where primary_image ~ old_pattern;
end $$;

alter table public.listings enable trigger set_listings_updated_at;
