import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapDbToFeedListing, type DbListing, type FeedListing } from '@/types/feed-listing';

export type ListingDetail = {
  listing: FeedListing;
  photos: string[];
  dbListing: DbListing;
};

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();

      if (error || !data) {
        console.error('[useListing] Failed to fetch listing:', error?.message ?? 'Not found');
        throw new Error(error?.message ?? 'Listing not found.');
      }

      const listing = mapDbToFeedListing(data as DbListing);
      const { data: photoRows, error: photoError } = await supabase
        .from('listing_photos')
        .select('image_url')
        .eq('listing_id', id)
        .order('display_order', { ascending: true });

      if (photoError) {
        console.error('[useListing] Failed to fetch listing photos:', photoError.message);
      }

      const photos = (photoRows ?? []).map((p) => p.image_url).filter(Boolean);
      return { listing, photos, dbListing: data } as ListingDetail;
    },
    enabled: !!id,
  });
}
