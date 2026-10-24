import { supabase } from '@/lib/supabase';
import type { Place } from '@/types/place';

export const PLACES_QUERY_KEY = ['places', 'discover'] as const;

/** In-memory store for places created this session before the query cache refreshes. */
let createdPlaces: Place[] = [];

export function addPlace(place: Place): void {
  createdPlaces = [place, ...createdPlaces];
}

export function findPlace(id: string): Place | undefined {
  return createdPlaces.find((p) => p.id === id);
}

const PLACES_SELECT = `
  id,
  name,
  category,
  area,
  address,
  description,
  latitude,
  longitude,
  rating,
  rating_count,
  verified,
  featured,
  place_photos ( url, sort_order )
` as const;

function mapRow(row: Record<string, any>): Place {
  const sortedPhotos = [...(row.place_photos ?? [])].sort(
    (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as Place['category'],
    area: row.area as string,
    city: 'Minna',
    address: row.address ?? '',
    description: row.description as string,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    priceRange: 1,
    rating: row.rating ?? 0,
    ratingCount: row.rating_count ?? 0,
    tags: [],
    hours: '',
    openStatus: 'unknown' as const,
    verified: row.verified ?? false,
    featured: row.featured ?? false,
    images: sortedPhotos.map((p: any) => p.url).join(','),
  };
}

export async function fetchPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select(PLACES_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[places-service] fetchPlaces failed:', error.message);
    throw new Error(error.message);
  }

  const remote = (data ?? []).map(mapRow);

  // Prepend session-local places not yet returned by the DB
  const remoteIds = new Set(remote.map((p) => p.id));
  const newLocals = createdPlaces.filter((p) => !remoteIds.has(p.id));

  return [...newLocals, ...remote];
}

/**
 * Server-side place search across name, area, address, and category.
 *
 * Category matching is synonym-aware: if the user types "restaurant" the query
 * resolves that to the "food" category key via category_synonyms, then includes
 * all food places in the results alongside any name/area/address matches.
 */
export async function searchPlaces(query: string): Promise<Place[]> {
  const trimmed = query.trim();
  if (!trimmed) return fetchPlaces();

  // Step 1: Resolve category keys from synonyms + category label/key itself
  const [synonymRows, categoryRows] = await Promise.all([
    supabase
      .from('category_synonyms')
      .select('key')
      .ilike('synonym', `%${trimmed}%`),
    supabase
      .from('place_categories')
      .select('key')
      .or(`key.ilike.%${trimmed}%,label.ilike.%${trimmed}%`),
  ]);

  const matchedCategoryKeys = new Set<string>();
  synonymRows.data?.forEach((r) => matchedCategoryKeys.add(r.key));
  categoryRows.data?.forEach((r) => matchedCategoryKeys.add(r.key));

  // Step 2: Build the OR filter for places
  // Always search name, area, address. If the query resolved category keys,
  // add a category.in(...) arm so e.g. "restaurant" returns all food places.
  const orParts = [
    `name.ilike.%${trimmed}%`,
    `area.ilike.%${trimmed}%`,
    `address.ilike.%${trimmed}%`,
  ];

  let query_ = supabase
    .from('places')
    .select(PLACES_SELECT)
    .order('created_at', { ascending: false });

  if (matchedCategoryKeys.size > 0) {
    // Use .or() for text fields and .in() for category via a combined filter
    const categoryList = Array.from(matchedCategoryKeys).join(',');
    query_ = query_.or(
      [...orParts, `category.in.(${categoryList})`].join(','),
    );
  } else {
    query_ = query_.or(orParts.join(','));
  }

  const { data, error } = await query_;

  if (error) {
    console.error('[places-service] searchPlaces failed:', error.message);
    throw new Error(error.message);
  }

  const remote = (data ?? []).map(mapRow);

  // Also include session-local places that match (not yet in DB)
  const remoteIds = new Set(remote.map((p) => p.id));
  const term = trimmed.toLowerCase();
  const matchingLocals = createdPlaces.filter((p) => {
    if (remoteIds.has(p.id)) return false;
    return (
      p.name.toLowerCase().includes(term) ||
      p.area.toLowerCase().includes(term) ||
      p.address.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  });

  return [...matchingLocals, ...remote];
}

export async function fetchPlaceById(id: string): Promise<Place | null> {
  // Session-local first — just-created places may not be in DB yet
  const local = createdPlaces.find((p) => p.id === id);
  if (local) return local;

  const { data, error } = await supabase
    .from('places')
    .select(PLACES_SELECT)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // row not found
    console.error('[places-service] fetchPlaceById failed:', error.message);
    throw new Error(error.message);
  }

  return mapRow(data);
}
