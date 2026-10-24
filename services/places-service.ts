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
