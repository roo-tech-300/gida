import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapDbToFeedListing, type DbListing } from '@/types/feed-listing';

export function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, description, price_amount, location_landmark, city, category, layout_type, number_of_bedrooms, number_of_bathrooms, size_sqft, total_floors, primary_image, status, featured, custom_features, is_shared_bathroom, is_shared_kitchen, has_borehole, has_generator, has_fenced_gate, has_internet, has_burglary, has_cabinet, has_wardrobe')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((item) => mapDbToFeedListing(item as DbListing));
    },
  });
}
