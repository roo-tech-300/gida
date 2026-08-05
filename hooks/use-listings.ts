import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapDbToFeedListing, type DbListing, type FeedListing } from '@/types/feed-listing';
import { discoverListings } from '@/dummy/listings-mock';
import { MOCK_ESTATES } from '@/dummy/liquidity-mock';

export function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      let dbListings: FeedListing[] = [];
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('id, title, description, price_amount, location_landmark, city, category, layout_type, number_of_bedrooms, number_of_bathrooms, size_sqft, total_floors, primary_image, status, featured, custom_features, is_shared_bathroom, is_shared_kitchen, has_borehole, has_generator, has_fenced_gate, has_internet, has_burglary, has_cabinet, has_wardrobe, property_tier, max_roommates, estate_id, abstract_slots_available, rules')
          .order('created_at', { ascending: false });

        if (!error && data) {
          dbListings = data.map((item) => mapDbToFeedListing(item as DbListing));
        }
      } catch (err) {
        console.warn('[useListings] Supabase fetch failed or offline, serving showcase properties:', err);
      }

      const showcaseFeed: FeedListing[] = discoverListings.map((p, index) => {
        const tier = index + 1;
        const matchingEstate = MOCK_ESTATES.find((e) => e.property_tier === tier) || MOCK_ESTATES[0];
        return {
          id: p.id,
          title: p.title,
          location: p.location,
          price: p.price,
          beds: p.beds,
          baths: p.baths,
          size: p.size,
          floor: p.floor || 'Ground',
          status: p.status,
          description: p.description || '',
          amenities: p.amenities || [],
          photoCount: p.photoCount || 12,
          hasVirtualTour: p.hasVirtualTour || false,
          image: typeof p.image === 'string' ? p.image : (matchingEstate.primary_image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'),
          category: p.category,
          featured: p.featured,
          layoutType: tier === 1 ? 'Studio' : 'Apartment',
          propertyTier: tier,
          abstractSlotsAvailable: tier * 10,
          estateId: matchingEstate.id,
        };
      });

      const existingIds = new Set(dbListings.map((l) => l.id));
      const newShowcases = showcaseFeed.filter((l) => !existingIds.has(l.id));
      return [...newShowcases, ...dbListings];
    },
  });
}
