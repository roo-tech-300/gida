import type { DbListingVideo, ListingVideo, ListingVideoStatus } from '@/types/listing-video';
import { mediaCdnUrl } from '@/utils/media-url';

const STATUSES: readonly ListingVideoStatus[] = ['queued', 'processing', 'ready', 'failed'];

function isDbListingVideo(value: unknown): value is DbListingVideo {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.listing_id === 'string' &&
    STATUSES.includes(row.status as ListingVideoStatus)
  );
}

export function mapDbToListingVideo(row: DbListingVideo): ListingVideo {
  return {
    id: row.id,
    listingId: row.listing_id,
    status: row.status,
    hlsUrl: mediaCdnUrl(row.hls_path),
    posterUrl: mediaCdnUrl(row.poster_path),
    previewUrl: mediaCdnUrl(row.preview_path),
    durationSeconds: row.duration_seconds,
    aspectRatio: row.width && row.height ? row.width / row.height : null,
    error: row.error,
  };
}

/** Validates rows from Supabase; malformed rows are logged and skipped, not rendered. */
export function parseListingVideoRows(rows: unknown[]): ListingVideo[] {
  return rows.flatMap((row) => {
    if (isDbListingVideo(row)) return [mapDbToListingVideo(row)];
    console.error('[ListingVideos] Skipping malformed listing_videos row:', row);
    return [];
  });
}
