function cdnBase(): string {
  // Expo only inlines env vars accessed with a literal key.
  return (process.env.EXPO_PUBLIC_MEDIA_CDN_URL ?? '').trim().replace(/\/+$/, '');
}

/**
 * Turns a stored path like `v/<id>/master.m3u8` into a CDN URL.
 * Returns null when the path is missing or no CDN is configured, so callers fall back
 * to the cover photo instead of requesting a broken relative URL.
 */
export function mediaCdnUrl(path: string | null): string | null {
  const base = cdnBase();
  if (!path || !base) return null;
  return `${base}/${path.replace(/^\//, '')}`;
}

/**
 * The poster sits next to the preview clip (`v/<id>/preview.mp4` -> `v/<id>/poster.jpg`),
 * so the feed can show it as a cover without an extra query.
 */
export function posterPathFromPreview(previewPath: string | null): string | null {
  if (!previewPath || !/\/preview\.mp4$/.test(previewPath)) return null;
  return previewPath.replace(/preview\.mp4$/, 'poster.jpg');
}

export function formatVideoDuration(totalSeconds: number | null): string {
  if (totalSeconds == null) return '';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
