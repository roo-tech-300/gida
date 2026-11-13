-- Listings created with gallery photos only (no hero) have a NULL cover and show a blank card.
-- Use the first gallery photo as the cover.
alter table public.listings disable trigger set_listings_updated_at;

update public.listings l
   set primary_image = p.image_url
  from (
    select distinct on (listing_id) listing_id, image_url
      from public.listing_photos
     order by listing_id, display_order, created_at, id
  ) p
 where l.id = p.listing_id and l.primary_image is null;

alter table public.listings enable trigger set_listings_updated_at;
