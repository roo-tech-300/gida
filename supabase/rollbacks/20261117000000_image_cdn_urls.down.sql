-- Restores the original Supabase Storage URLs saved by 20261117000000_image_cdn_urls.sql.
-- Run manually (SQL editor or psql); it is not part of supabase/migrations.

alter table public.listings disable trigger set_listings_updated_at;

update public.listings l set primary_image = b.old_value
  from public.image_url_rewrite_backup b
  where b.table_name = 'listings' and b.column_name = 'primary_image' and b.row_id = l.id;

update public.listing_photos p set image_url = b.old_value
  from public.image_url_rewrite_backup b
  where b.table_name = 'listing_photos' and b.column_name = 'image_url' and b.row_id = p.id;

update public.profiles p set avatar_url = b.old_value
  from public.image_url_rewrite_backup b
  where b.table_name = 'profiles' and b.column_name = 'avatar_url' and b.row_id = p.id;

update public.estates e set primary_image = b.old_value
  from public.image_url_rewrite_backup b
  where b.table_name = 'estates' and b.column_name = 'primary_image' and b.row_id = e.id;

alter table public.listings enable trigger set_listings_updated_at;

-- Once you are sure nothing needs undoing: drop table public.image_url_rewrite_backup;
