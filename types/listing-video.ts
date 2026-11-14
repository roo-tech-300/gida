export type ListingVideoStatus = 'queued' | 'processing' | 'ready' | 'failed';

/** Row shape of public.listing_videos (written only by the media server). */
export interface DbListingVideo {
  id: string;
  listing_id: string;
  status: ListingVideoStatus;
  hls_path: string | null;
  poster_path: string | null;
  preview_path: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  display_order: number;
  error: string | null;
  created_at: string;
}

export interface ListingVideo {
  id: string;
  listingId: string;
  status: ListingVideoStatus;
  /** Absolute CDN URLs; null until the video is ready. */
  hlsUrl: string | null;
  posterUrl: string | null;
  previewUrl: string | null;
  durationSeconds: number | null;
  /** width / height of the encoded video, e.g. 0.5625 for portrait 9:16. */
  aspectRatio: number | null;
  error: string | null;
}

export interface ReadyListingVideo extends ListingVideo {
  status: 'ready';
  hlsUrl: string;
  posterUrl: string;
  previewUrl: string;
}

export function isReadyVideo(video: ListingVideo): video is ReadyListingVideo {
  return video.status === 'ready' && !!video.hlsUrl && !!video.posterUrl && !!video.previewUrl;
}
