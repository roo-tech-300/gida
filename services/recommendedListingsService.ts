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

  const rows = await withVideoPreviews((data ?? []) as RecommendedDbListing[]);
  return rows.map((row) => ({
    ...mapDbToFeedListing(row),
    photoCount: row.images?.length ?? 0,
    relevanceScore: row.relevance_score,
  }));
}

/**
 * get_recommended_listings predates listings.video_preview_path. Until the
 * function returns that column, fetch it for the whole page in one query.
 */
async function withVideoPreviews(rows: RecommendedDbListing[]): Promise<RecommendedDbListing[]> {
  if (rows.length === 0 || 'video_preview_path' in rows[0]) return rows;

  const { data, error } = await supabase
    .from('listings')
    .select('id, video_preview_path')
    .in('id', rows.map((row) => row.id))
    .not('video_preview_path', 'is', null);

  if (error) {
    console.error('[fetchRecommendedListings] Failed to fetch video previews (feed shows photos only):', error.message);
    return rows;
  }

  const previews = new Map((data ?? []).map((row: { id: string; video_preview_path: string | null }) => [row.id, row.video_preview_path]));
  return rows.map((row) => ({ ...row, video_preview_path: previews.get(row.id) ?? null }));
}
