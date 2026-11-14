import { supabase } from '@/lib/supabase';
import type { ListingVideo } from '@/types/listing-video';
import { parseListingVideoRows } from '@/utils/listing-video-mapper';

const COLUMNS =
  'id, listing_id, status, hls_path, poster_path, preview_path, duration_seconds, width, height, display_order, error, created_at';

/** RLS decides what comes back: students only get ready videos. */
export async function fetchListingVideos(listingId: string): Promise<ListingVideo[]> {
  const { data, error } = await supabase
    .from('listing_videos')
    .select(COLUMNS)
    .eq('listing_id', listingId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return parseListingVideoRows(data ?? []);
}
