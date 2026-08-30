import type { FeedListing } from '@/types/feed-listing';
import type { ListingAttachment } from '@/types/messages';

export function toListingAttachment(
  listing: Pick<FeedListing, 'id' | 'title' | 'image' | 'price' | 'location'>,
): ListingAttachment {
  return {
    type: 'listing',
    listingId: listing.id,
    title: listing.title,
    image: listing.image || null,
    price: listing.price,
    location: listing.location,
  };
}