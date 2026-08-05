import { supabase } from '@/lib/supabase';
import { mapDbToFeedListing, type DbListing, type FeedListing } from '@/types/feed-listing';
import { discoverListings } from '@/dummy/listings-mock';
import { MOCK_ESTATES } from '@/dummy/liquidity-mock';

export type RecommendedDbListing = DbListing & {
  relevance_score: number;
  images: string[] | null;
  created_at: string;
  updated_at: string;
};

export type RecommendedFeedListing = FeedListing & { relevanceScore: number };

export async function fetchRecommendedListings(
  userId: string,
  page = 0,
  limit = 20,
): Promise<RecommendedFeedListing[]> {
  let dbResults: RecommendedFeedListing[] = [];
  try {
    const { data, error } = await supabase.rpc('get_recommended_listings', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: page * limit,
    });
    if (!error && data) {
      dbResults = data.map((row: RecommendedDbListing) => ({
        ...mapDbToFeedListing(row),
        photoCount: row.images?.length ?? 0,
        relevanceScore: row.relevance_score,
      }));
    }
  } catch (err) {
    console.warn('[fetchRecommendedListings] Supabase RPC failed or offline, serving showcase items.');
  }

  const showcaseRecommended: RecommendedFeedListing[] = discoverListings.map((p, index) => {
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
      relevanceScore: 100 - index,
    };
  });

  const existingIds = new Set(dbResults.map((l) => l.id));
  const addedShowcases = showcaseRecommended.filter((l) => !existingIds.has(l.id));
  return [...addedShowcases, ...dbResults];
}
