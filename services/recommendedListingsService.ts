import { supabase } from '@/lib/supabase';
import { mapDbToFeedListing, type DbListing, type FeedListing } from '@/types/feed-listing';

export type RecommendedDbListing = DbListing & {
  relevance_score: number;
  images: string[] | null;
  created_at: string;
  updated_at: string;
};

export type RecommendedFeedListing = FeedListing & { relevanceScore: number };

/**
 * The `get_recommended_listings` RPC may predate the `slashed_price` column.
 * When no row carries the field we backfill it for the current page with a
 * single lightweight lookup, so the discount still renders on the feed.
 */
async function hydrateSlashedPrices(rows: RecommendedDbListing[]): Promise<void> {
  if (rows.length === 0) return;
  if (!rows.every((row) => row.slashed_price === undefined)) return;

  const { data, error } = await supabase
    .from('listings')
    .select('id, slashed_price')
    .in('id', rows.map((row) => row.id));

  if (error) {
    console.error('[fetchRecommendedListings] Failed to hydrate slashed prices:', error.message);
    return;
  }

  const byId = new Map((data ?? []).map((row) => [row.id, row.slashed_price as number | null]));
  rows.forEach((row) => {
    row.slashed_price = byId.get(row.id) ?? null;
  });
}

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

  const rows = (data ?? []) as RecommendedDbListing[];
  await hydrateSlashedPrices(rows);

  return rows.map((row) => ({
    ...mapDbToFeedListing(row),
    photoCount: row.images?.length ?? 0,
    relevanceScore: row.relevance_score,
  }));
}
