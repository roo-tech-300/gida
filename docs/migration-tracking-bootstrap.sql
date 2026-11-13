-- Records the repo's migrations as applied so `supabase db push` / `migration list` work.
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text not null primary key, statements text[], name text);
insert into supabase_migrations.schema_migrations (version, name, statements)
select v, n, array[]::text[] from (values
  ('20261111000000', 'baseline_from_hosted'),
  ('20261112000000', 'payment_links'),
  ('20261112000001', 'fix_pod_member_payment_statuses'),
  ('20261113000000', 'hold_starts_at_approval'),
  ('20261114000000', 'single_support_thread'),
  ('20261114000001', 'merge_support_threads'),
  ('20261115000000', 'household_chat'),
  ('20261116000000', 'spots_left'),
  ('20261117000000', 'image_cdn_urls'),
  ('20261118000000', 'backfill_primary_image')
) t(v, n) on conflict (version) do nothing;
