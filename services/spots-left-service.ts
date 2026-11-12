import { supabase } from '@/lib/supabase';
import { parseSpotsLeft } from '@/utils/spots-left';

/** Spots left for up to 100 listings in one call. */
export async function fetchSpotsLeft(listingIds: readonly string[]): Promise<Record<string, number>> {
  if (listingIds.length === 0) return {};
  const { data, error } = await supabase.rpc('get_spots_left', { p_listing_ids: [...listingIds] });
  if (error) {
    console.error('[SpotsLeft] Failed to load spots left:', error.message);
    throw new Error(error.message);
  }
  return parseSpotsLeft(data);
}
