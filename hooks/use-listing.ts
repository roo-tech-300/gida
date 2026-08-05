import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapDbToFeedListing, type DbListing, type FeedListing } from '@/types/feed-listing';
import { discoverListings } from '@/dummy/listings-mock';
import { MOCK_ESTATES } from '@/dummy/liquidity-mock';

export type ListingDetail = {
  listing: FeedListing;
  photos: string[];
  dbListing: DbListing;
};

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      let data: DbListing | null = null;
      try {
        const res = await supabase.from('listings').select('*').eq('id', id).single();
        if (!res.error && res.data) {
          data = res.data as DbListing;
        }
      } catch (err) {
        console.warn('[useListing] Supabase select failed or offline, attempting showcase fallback.');
      }

      if (!data) {
        const mockIdx = discoverListings.findIndex((p) => p.id === id);
        const mockMatch = mockIdx >= 0 ? discoverListings[mockIdx] : null;
        if (mockMatch) {
          const tier = mockIdx + 1;
          const matchingEstate = MOCK_ESTATES.find((e) => e.property_tier === tier) || MOCK_ESTATES[0];
          const img = typeof mockMatch.image === 'string' ? mockMatch.image : (matchingEstate.primary_image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800');
          const syntheticDb: DbListing = {
            id: mockMatch.id,
            title: mockMatch.title,
            description: mockMatch.description || '',
            price_amount: parseInt(mockMatch.price.replace(/[^0-9]/g, ''), 10) * 1000000 || 15000000,
            location_landmark: mockMatch.location.split(',')[0] || mockMatch.location,
            city: mockMatch.location.split(',')[1]?.trim() || 'Lagos',
            category: mockMatch.category,
            layout_type: tier === 1 ? 'Studio' : 'Apartment',
            number_of_bedrooms: tier,
            number_of_bathrooms: tier,
            size_sqft: parseInt(mockMatch.size.replace(/[^0-9]/g, ''), 10) || 1500,
            total_floors: 15,
            primary_image: img,
            status: mockMatch.status,
            featured: mockMatch.featured,
            custom_features: mockMatch.amenities || [],
            is_shared_bathroom: false,
            is_shared_kitchen: tier > 1,
            has_borehole: true,
            has_generator: true,
            has_fenced_gate: true,
            has_internet: true,
            has_burglary: true,
            has_cabinet: true,
            has_wardrobe: true,
            landlord_id: 'landlord-showcase',
            admin_id: 'admin-showcase',
            lease_term: '1 Year',
            units_available: 10,
            latitude: 6.5244,
            longitude: 3.3792,
            campus: matchingEstate.campus || 'University of Lagos, Akoka',
            estate_id: matchingEstate.id,
            property_tier: tier,
            max_roommates: tier,
            abstract_slots_available: tier * 10,
            rules: ['Quiet hours after 10 PM', 'No smoking indoors', 'Student ID required'],
          };
          const listing = mapDbToFeedListing(syntheticDb);
          return { listing, photos: [img], dbListing: syntheticDb } as ListingDetail;
        }
        throw new Error('Listing not found.');
      }

      const listing = mapDbToFeedListing(data);
      const { data: photoRows } = await supabase
        .from('listing_photos')
        .select('image_url')
        .eq('listing_id', id)
        .order('display_order', { ascending: true });

      const photos = (photoRows || []).map((p) => p.image_url).filter(Boolean);
      return { listing, photos, dbListing: data } as ListingDetail;
    },
    enabled: !id,
  });
}
