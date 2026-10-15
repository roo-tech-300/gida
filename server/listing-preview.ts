export type ListingPreview = {
  id: string;
  title: string;
  description: string | null;
  priceAmount: number;
  locationLandmark: string;
  city: string;
  campus: string | null;
  primaryImage: string | null;
  bedrooms: number;
  bathrooms: number;
};

type ListingRow = {
  id: string;
  title: string;
  description: string | null;
  price_amount: number;
  location_landmark: string;
  city: string;
  campus: string | null;
  primary_image: string | null;
  number_of_bedrooms: number;
  number_of_bathrooms: number;
};

type CacheEntry = { expiresAt: number; preview: ListingPreview | null };

const CACHE = new Map<string, CacheEntry>();
const CACHE_MAX_ENTRIES = 500;
const POSITIVE_TTL_MS = 5 * 60_000;
const NEGATIVE_TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 4_000;

const SELECT_COLUMNS =
  'id,title,description,price_amount,location_landmark,city,campus,primary_image,number_of_bedrooms,number_of_bathrooms';

function store(listingId: string, preview: ListingPreview | null, ttlMs: number): void {
  CACHE.set(listingId, { expiresAt: Date.now() + ttlMs, preview });
  if (CACHE.size > CACHE_MAX_ENTRIES) {
    const oldest = CACHE.keys().next();
    if (!oldest.done) CACHE.delete(oldest.value);
  }
}

function mapRow(row: ListingRow): ListingPreview {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priceAmount: row.price_amount,
    locationLandmark: row.location_landmark,
    city: row.city,
    campus: row.campus,
    primaryImage: row.primary_image,
    bedrooms: row.number_of_bedrooms,
    bathrooms: row.number_of_bathrooms,
  };
}

/**
 * Fetches the minimal listing fields needed for a share preview via the
 * public Supabase REST API (anon key — the same credentials the app bundle
 * ships). Results are TTL-cached per warm function instance so link
 * previews never hammer the database. Returns null on any failure; callers
 * should fall back to the static page shell.
 */
export async function fetchListingPreview(listingId: string): Promise<ListingPreview | null> {
  const cached = CACHE.get(listingId);
  if (cached && cached.expiresAt > Date.now()) return cached.preview;

  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      console.error(
        '[ListingPreview] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set; skipping preview enrichment.'
      );
      return null;
    }

    const endpoint = new URL('/rest/v1/listings', supabaseUrl);
    endpoint.searchParams.set('select', SELECT_COLUMNS);
    endpoint.searchParams.set('id', `eq.${listingId}`);
    endpoint.searchParams.set('limit', '1');

    const response = await fetch(endpoint, {
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${anonKey}`,
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`[ListingPreview] Supabase responded ${response.status} for listing ${listingId}.`);
      store(listingId, null, NEGATIVE_TTL_MS);
      return null;
    }

    const rows = (await response.json()) as ListingRow[];
    const row = rows[0];
    if (!row) {
      store(listingId, null, NEGATIVE_TTL_MS);
      return null;
    }

    const preview = mapRow(row);
    store(listingId, preview, POSITIVE_TTL_MS);
    return preview;
  } catch (error) {
    console.error('[ListingPreview] Failed to fetch listing preview:', error);
    store(listingId, null, NEGATIVE_TTL_MS);
    return null;
  }
}
