interface Env {
  SUPABASE_URL: string;
}

const ALLOWED_PATH = /^\/(listing-images|place-photos|avatars)\/[^?#]+$/;
const ONE_YEAR = 'public, max-age=31536000, immutable';

/** Maps /<bucket>/<path> to the public Supabase Storage URL, or null for anything else. */
export function toOriginUrl(supabaseUrl: string, pathname: string): string | null {
  if (!ALLOWED_PATH.test(pathname) || pathname.includes('..')) return null;
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public${pathname}`;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }
    const originUrl = toOriginUrl(env.SUPABASE_URL, new URL(request.url).pathname);
    if (!originUrl) return new Response('Not found', { status: 404 });

    const cache = caches.default;
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const origin = await fetch(originUrl);
      if (!origin.ok) return new Response('Not found', { status: origin.status === 404 ? 404 : 502 });

      const response = new Response(origin.body, origin);
      response.headers.set('Cache-Control', ONE_YEAR);
      response.headers.set('Access-Control-Allow-Origin', '*');
      ctx.waitUntil(cache.put(request, response.clone()));
      return response;
    } catch (error: unknown) {
      console.error('[ImageProxy] Failed to fetch from origin:', originUrl, error);
      return new Response('Bad gateway', { status: 502 });
    }
  },
};
