import { fetchListingPhotos } from '@/hooks/use-listing-photos';
import { supabase } from '@/lib/supabase';
import { mapDbToFeedListing, type DbListing, type FeedListing } from '@/types/feed-listing';
import { useQuery } from '@tanstack/react-query';

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
      const message = error instanceof Error 
        ? error.message 
        : (error && typeof error === 'object' && 'message' in error) 
          ? String((error as { message?: unknown }).message) 
          : String(error);
      console.error('[useListing] Failed to fetch listing:', message);
      throw new Error(message ?? 'Listing not found.');
    }


      const listing = mapDbToFeedListing(data as DbListing);

      let photos: string[];
      try {
        photos = await fetchListingPhotos(id);
      } catch (photoError) {
        const message = photoError instanceof Error ? photoError.message : String(photoError);
        console.error('[useListing] Failed to fetch listing photos:', message);
        photos = [];
      }

      return { listing, photos, dbListing: data } as ListingDetail;
    },
    enabled: !!id,
  });
}
