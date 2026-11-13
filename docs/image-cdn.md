# Free image CDN for Supabase Storage

Goal: stop every image view counting against Supabase "Cached Egress" (5 GB/month on the free plan).
Photos are public and immutable (unique path per upload, one-year `cache-control`), so they cache perfectly.

## Option A (recommended, $0): a Cloudflare Worker in front of the buckets

Cloudflare's free plan allows 100,000 Worker requests/day and its cache is free. The Worker fetches an
image from Supabase once, then serves later views from Cloudflare's cache. Photos are fine on the free
plan; the restriction in `media-server/README.md` applies to **video** only.

```ts
// worker-images/src/index.ts  (deploy with `wrangler deploy`; set SUPABASE_URL as a var)
interface Env { SUPABASE_URL: string }

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method !== 'GET' || !/^\/(listing-images|place-photos|avatars)\//.test(pathname)) {
      return new Response('Not found', { status: 404 });
    }
    const cache = caches.default;
    const hit = await cache.match(request);
    if (hit) return hit;

    const origin = await fetch(`${env.SUPABASE_URL}/storage/v1/object/public${pathname}`);
    if (!origin.ok) return origin;
    const response = new Response(origin.body, origin);
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('Access-Control-Allow-Origin', '*');
    ctx.waitUntil(cache.put(request, response.clone()));
    return response;
  },
};
```

Use a free `*.workers.dev` hostname, or a custom domain if you have one on Cloudflare DNS.
Then image URLs change from
`https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>` to `https://<worker-host>/<bucket>/<path>`.

## Option B: Bunny.net pull zone (paid, about $1/month)
Already planned for video in `media-server/README.md`. Zero code: point a pull zone at the Supabase URL.

## Other free options and why not
- **jsDelivr / GitHub Pages:** only for files committed to a repo, not for user uploads.
- **Cloudflare proxy on a Supabase custom domain:** Supabase custom domains are a paid add-on.
- **Cloudflare R2:** 10 GB storage and **zero egress fees**. Better long term (move images there), but needs an upload path change.

## After the CDN is live
1. Rewrite saved URLs once (listings.primary_image, listing_photos.image_url, profiles.avatar_url)
   with a SQL `replace()` on the host prefix, and use the CDN host for new uploads.
2. Old app builds keep working because the Supabase URLs still resolve.
