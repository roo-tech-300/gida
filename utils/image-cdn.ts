// Matches any Supabase Storage public URL for the three image buckets.
const STORAGE_PUBLIC_URL = /^https?:\/\/[^/]+\/storage\/v1\/object\/public\/(listing-images|place-photos|avatars)\/(.+)$/;

/**
 * Rewrites a Supabase Storage public URL to the image CDN (a Cloudflare Worker that
 * caches photos), so repeat views don't count against Supabase egress.
 * Returns the URL unchanged when no CDN is configured or the URL is not a storage URL.
 */
export function toCdnImageUrl(url: string, cdnBase: string | undefined = process.env.EXPO_PUBLIC_IMAGE_CDN_URL): string {
  const base = cdnBase?.trim().replace(/\/+$/, '');
  if (!base) return url;
  const match = STORAGE_PUBLIC_URL.exec(url);
  return match ? `${base}/${match[1]}/${match[2]}` : url;
}
