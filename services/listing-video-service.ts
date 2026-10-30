import { supabase } from '@/lib/supabase';
import type { ListingVideo } from '@/types/listing-video';
import { parseListingVideoRows } from '@/utils/listing-video-mapper';
import { mediaServerUrl } from '@/utils/media-url';

const COLUMNS =
  'id, listing_id, status, hls_path, poster_path, preview_path, duration_seconds, width, height, display_order, error, created_at';

/**
 * RLS decides what comes back: students only get ready videos, admins who
 * manage the listing also see queued/processing/failed ones.
 */
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

export async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('You need to be signed in to manage videos.');
  return token;
}

async function readServerError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === 'string') return body.error;
  } catch (parseError) {
    console.error('[ListingVideos] Media server sent a non-JSON error body:', parseError);
  }
  return `Media server error (${response.status})`;
}

/** Deletes the files on the media server, which also removes the row. */
export async function deleteListingVideo(videoId: string): Promise<void> {
  const token = await getAccessToken();
  const response = await fetch(mediaServerUrl(`/videos/${videoId}`), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(await readServerError(response));
  }
}
