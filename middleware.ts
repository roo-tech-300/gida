import { next } from '@vercel/functions';

import { fetchListingPreview } from './server/listing-preview';
import { buildListingHead, injectListingHead } from './server/og-meta';

const SHELL_FETCH_TIMEOUT_MS = 5_000;

/**
 * Vercel Routing Middleware for share previews.
 *
 * When a listing URL (https://www.gida.apartments/property/{id}) is opened
 * — by a person or by WhatsApp/iMessage/Twitter's link crawler — we fetch
 * the listing and serve the static app shell with listing-specific
 * Open Graph / Twitter meta tags injected, so shared links render a rich
 * preview (thumbnail = listing.primary_image, title, price, details).
 *
 * Every failure path falls through to `next()`, which preserves the
 * existing vercel.json rewrite behaviour (/property/:path* -> /).
 */
export default async function middleware(request: Request): Promise<Response> {
  if (request.method !== 'GET') return next();

  const pathname = new URL(request.url).pathname;
  const listingId = pathname.split('/').filter(Boolean)[1];
  if (!listingId) return next();

  try {
    const preview = await fetchListingPreview(listingId);
    if (!preview) return next();

    // Fetch the static shell from "/" — a path the matcher never runs on,
    // so this cannot recurse through the middleware.
    const shellResponse = await fetch(new URL('/', request.url), {
      headers: { accept: 'text/html' },
      signal: AbortSignal.timeout(SHELL_FETCH_TIMEOUT_MS),
    });
    if (!shellResponse.ok) {
      throw new Error(`Static shell responded ${shellResponse.status}`);
    }

    const canonicalUrl = new URL(`/property/${encodeURIComponent(listingId)}`, request.url).toString();
    const html = injectListingHead(await shellResponse.text(), buildListingHead(preview, canonicalUrl));
    if (html === null) {
      console.error('[ListingOg] Shell has no </head> marker; falling back to static shell.');
      return next();
    }

    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[ListingOg] Failed to render share preview meta; falling back to static shell:', error);
    return next();
  }
}

export const config = {
  matcher: ['/property/:path*'],
};
