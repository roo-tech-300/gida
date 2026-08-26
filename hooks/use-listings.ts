import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapDbToFeedListing, type DbListing } from '@/types/feed-listing';

export function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, description, price_amount, location_landmark, city, category, layout_type, number_of_bedrooms, number_of_bathrooms, size_sqft, total_floors, primary_image, status, featured, custom_features, is_shared_bathroom, is_shared_kitchen, has_borehole, has_generator, has_fenced_gate, has_internet, has_burglary, has_cabinet, has_wardrobe, property_tier, max_roommates, estate_id, abstract_slots_available, rules')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useListings] Failed to fetch listings:', error.message);
        throw new Error(error.message);
      }

      return (data ?? []).map((item) => mapDbToFeedListing(item as DbListing));
    },
  });
}

export function useInfiniteListings(limit = 10) {
  return useInfiniteQuery({
    queryKey: ['infinite-listings'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from('listings')
        .select('id, title, description, price_amount, location_landmark, city, category, layout_type, number_of_bedrooms, number_of_bathrooms, size_sqft, total_floors, primary_image, status, featured, custom_features, is_shared_bathroom, is_shared_kitchen, has_borehole, has_generator, has_fenced_gate, has_internet, has_burglary, has_cabinet, has_wardrobe, property_tier, max_roommates, estate_id, abstract_slots_available, rules')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('[useInfiniteListings] Failed to fetch listings:', error.message);
        throw new Error(error.message);
      }

      return (data ?? []).map((item) => mapDbToFeedListing(item as DbListing));
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < limit ? undefined : allPages.length;
    },
  });
}
