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

export async function fetchPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select(`
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
      phone,
      place_photos ( url, sort_order )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[places-service] Failed to fetch places:', error.message);
    throw new Error(error.message);
  }

  const remote: Place[] = (data ?? []).map((row) => {
    const sortedPhotos = [...(row.place_photos ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
    const images = sortedPhotos.map((p) => p.url).join(',');

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
      phone: row.phone ?? undefined,
      images,
    };
  });

  // Prepend any places created this session that haven't yet appeared in the DB response
  const remoteIds = new Set(remote.map((p) => p.id));
  const newLocals = createdPlaces.filter((p) => !remoteIds.has(p.id));

  return [...newLocals, ...remote];
}

export async function fetchPlaceById(id: string): Promise<Place | null> {
  // Check session-local first (just-created places may not be in DB yet)
  const local = createdPlaces.find((p) => p.id === id);
  if (local) return local;

  const { data, error } = await supabase
    .from('places')
    .select(`
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
      phone,
      place_photos ( url, sort_order )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    console.error('[places-service] fetchPlaceById failed:', error.message);
    throw new Error(error.message);
  }

  const sortedPhotos = [...(data.place_photos ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  return {
    id: data.id as string,
    name: data.name as string,
    category: data.category as Place['category'],
    area: data.area as string,
    city: 'Minna',
    address: data.address ?? '',
    description: data.description as string,
    latitude: data.latitude ?? undefined,
    longitude: data.longitude ?? undefined,
    priceRange: 1,
    rating: data.rating ?? 0,
    ratingCount: data.rating_count ?? 0,
    tags: [],
    hours: '',
    openStatus: 'unknown' as const,
    verified: data.verified ?? false,
    featured: data.featured ?? false,
    phone: data.phone ?? undefined,
    images: sortedPhotos.map((p) => p.url).join(','),
  };
}
