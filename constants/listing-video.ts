/** Must match the media server's MAX_* settings (media-server/.env). */
export const LISTING_VIDEO_LIMITS = {
  maxDurationSeconds: 180,
  maxBytes: 500 * 1024 * 1024,
  maxPerListing: 3,
} as const;

/** How often the admin screen re-checks videos that are still processing. */
export const LISTING_VIDEO_POLL_MS = 5000;
