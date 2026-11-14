-- One live reservation per student per listing. Cancelled and rejected reservations no longer
-- count, just like expired ones, so the student can reserve the place again.
drop index if exists public.slot_credits_user_listing_key;
create unique index slot_credits_user_listing_key
  on public.slot_credits (user_id, listing_id)
  where status not in ('expired', 'cancelled', 'rejected');
