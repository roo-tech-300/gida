type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_TRACKED = 5_000;
const buckets = new Map<string, Bucket>();

/**
 * Best-effort per-IP limiter for the public pay routes.
 * State lives in one Worker isolate, so it slows scripted guessing but is not a hard guarantee;
 * pair it with a Cloudflare rate-limiting rule on /api/pay/* for production.
 */
export function allowRequest(request: Request, limit: number, now: number = Date.now()): boolean {
  const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'local';
  if (buckets.size > MAX_TRACKED) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}
