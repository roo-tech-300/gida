import { PLACES } from '@/dummy/places-mock';
import type { Place } from '@/types/place';

/**
 * Temporary data source for the Discover directory.
 *
 * User-created places live in memory for the session; seed places come from
 * the dummy dataset. The latency mirrors the 1.3s dummy refresh contract used
 * across the app so loading and pull-to-refresh states are exercised
 * realistically.
 */
const MOCK_LATENCY_MS = 1300;

export const PLACES_QUERY_KEY = ['places', 'discover'] as const;

let createdPlaces: Place[] = [];

export function addPlace(place: Place): void {
  createdPlaces = [place, ...createdPlaces];
}

export function findPlace(id: string): Place | undefined {
  return createdPlaces.find((place) => place.id === id) ?? PLACES.find((place) => place.id === id);
}

export async function fetchPlaces(): Promise<Place[]> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS);
  });
  return [...createdPlaces, ...PLACES];
}
