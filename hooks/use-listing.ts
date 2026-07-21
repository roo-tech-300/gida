import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapDbToFeedListing, type DbListing } from '@/types/feed-listing';

export type ListingDetail = {
  listing: ReturnType<typeof mapDbToFeedListing>;
  photos: string[];
  dbListing: DbListing;
};

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const dbListing = data as DbListing;
      const listing = mapDbToFeedListing(dbListing);

      const { data: photoRows } = await supabase
        .from('listing_photos')
        .select('image_url')
        .eq('listing_id', id)
        .order('display_order', { ascending: true });

      const photos = (photoRows || []).map((p) => p.image_url).filter(Boolean);

      return { listing, photos, dbListing } as ListingDetail;
    },
    enabled: !!id,
  });
}
