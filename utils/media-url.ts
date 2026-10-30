function baseUrl(name: 'EXPO_PUBLIC_MEDIA_CDN_URL' | 'EXPO_PUBLIC_MEDIA_UPLOAD_URL'): string {
  // Expo only inlines env vars accessed with a literal key, hence the switch.
  const value =
    name === 'EXPO_PUBLIC_MEDIA_CDN_URL'
      ? process.env.EXPO_PUBLIC_MEDIA_CDN_URL
      : process.env.EXPO_PUBLIC_MEDIA_UPLOAD_URL;
  return (value ?? '').replace(/\/$/, '');
}

/** Turns a stored path like `v/<id>/master.m3u8` into a CDN URL. */
export function mediaCdnUrl(path: string | null): string | null {
  if (!path) return null;
  return `${baseUrl('EXPO_PUBLIC_MEDIA_CDN_URL')}/${path.replace(/^\//, '')}`;
}

/** The media server itself (uploads and deletes bypass the CDN). */
export function mediaServerUrl(route: string): string {
  return `${baseUrl('EXPO_PUBLIC_MEDIA_UPLOAD_URL')}${route}`;
}

export function formatVideoDuration(totalSeconds: number | null): string {
  if (totalSeconds == null) return '';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
