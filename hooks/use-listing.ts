import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapDbToFeedListing, type DbListing } from '@/types/feed-listing';

export type ListingDetail = {
  listing: ReturnType<typeof mapDbToFeedListing>;
  photos: string[];
};

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, description, price_amount, location_landmark, city, category, number_of_bedrooms, number_of_bathrooms, size_sqft, total_floors, primary_image, status, featured, custom_features, is_shared_bathroom, is_shared_kitchen, has_borehole, has_generator, has_fenced_gate, has_internet, has_burglary, has_cabinet, has_wardrobe')
        .eq('id', id)
        .single();

      if (error) throw error;

      const listing = mapDbToFeedListing(data as DbListing);

      const { data: photoRows } = await supabase
        .from('listing_photos')
        .select('image_url')
        .eq('listing_id', id)
        .order('display_order', { ascending: true });

      const photos = (photoRows || []).map((p) => p.image_url).filter(Boolean);

      return { listing, photos } as ListingDetail;
    },
    enabled: !!id,
  });
}
