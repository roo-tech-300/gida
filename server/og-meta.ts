import type { ListingPreview } from './listing-preview';

const FALLBACK_IMAGE_PATH = '/landing/gida.png';

const GENERIC_TITLE_RE = /<title\b[^>]*>[\s\S]*?<\/title>/i;
const GENERIC_DESCRIPTION_RE = /<meta\b[^>]*name\s*=\s*["']description["'][^>]*>/i;
const GENERIC_SOCIAL_META_RE =
  /<meta\b[^>]*\b(?:property|name)\s*=\s*["'](?:og:[^"']*|twitter:[^"']*)["'][^>]*>/gi;
const HEAD_CLOSE_RE = /<\/head>/i;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const cut = value.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = lastSpace > maxLength * 0.5 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.trimEnd()}…`;
}

function resolveImageUrl(primaryImage: string | null, origin: string): string {
  if (!primaryImage) return `${origin}${FALLBACK_IMAGE_PATH}`;
  try {
    return new URL(primaryImage, origin).toString();
  } catch (error) {
    console.error('[ListingOg] Invalid primary_image URL, using fallback:', primaryImage, error);
    return `${origin}${FALLBACK_IMAGE_PATH}`;
  }
}

/**
 * Builds the listing-specific <head> fragment (title, description and
 * Open Graph / Twitter card tags) rendered for social share previews.
 * `listing.primary_image` is used as the preview thumbnail.
 */
export function buildListingHead(preview: ListingPreview, canonicalUrl: string): string {
  const origin = new URL(canonicalUrl).origin;
  const location = [preview.locationLandmark, preview.city].filter(Boolean).join(', ');
  const price = `₦${Math.round(preview.priceAmount).toLocaleString('en-US')}/year`;
  const title = `${preview.title} — ${price}`;

  const detailBits = [
    location || null,
    preview.bedrooms > 0 ? `${preview.bedrooms} bed` : null,
    preview.bathrooms > 0 ? `${preview.bathrooms} bath` : null,
    preview.campus ? `near ${preview.campus}` : null,
  ].filter((bit): bit is string => bit !== null);

  const sourceDescription = preview.description?.trim() ?? '';
  const description = truncateAtWord(
    sourceDescription || `${detailBits.join(' · ')}. Available now on Gida.`,
    180
  );

  const image = resolveImageUrl(preview.primaryImage, origin);
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Gida" />',
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ];
  return tags.join('\n    ');
}

/**
 * Strips the generic (build-time) title/description/OG/Twitter tags from
 * the static app shell and injects the listing-specific ones before
 * </head>. Returns null when no </head> marker exists (caller should fall
 * back to the untouched shell).
 */
export function injectListingHead(html: string, headHtml: string): string | null {
  if (!HEAD_CLOSE_RE.test(html)) return null;
  const stripped = html
    .replace(GENERIC_TITLE_RE, '')
    .replace(GENERIC_DESCRIPTION_RE, '')
    .replace(GENERIC_SOCIAL_META_RE, '');
  return stripped.replace(HEAD_CLOSE_RE, `    ${headHtml}\n  </head>`);
}
