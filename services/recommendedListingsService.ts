import { supabase } from '@/lib/supabase';
import { mapDbToFeedListing, type DbListing, type FeedListing } from '@/types/feed-listing';

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
  const { data, error } = await supabase.rpc('get_recommended_listings', {
    p_user_id: userId,
    p_limit: limit,
    p_offset: page * limit,
  });

  if (error) {
    console.error('[fetchRecommendedListings] Failed to fetch recommended listings:', error.message);
    throw new Error(error.message);
  }

  return (data ?? []).map((row: RecommendedDbListing) => ({
    ...mapDbToFeedListing(row),
    photoCount: row.images?.length ?? 0,
    relevanceScore: row.relevance_score,
  }));
}
