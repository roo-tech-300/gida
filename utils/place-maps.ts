import { Linking } from 'react-native';

import type { Place } from '@/types/place';

function hasUsableCoordinate(value?: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value !== 0;
}

export function buildPlaceMapsUrl(place: Place): string {
  if (place.googleMapsUrl) {
    return place.googleMapsUrl;
  }

  if (place.googlePlaceId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${encodeURIComponent(place.googlePlaceId)}`;
  }

  if (hasUsableCoordinate(place.latitude) && hasUsableCoordinate(place.longitude)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
  }

  const query = [place.name, place.area, place.city].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Opens the place in Google Maps. Returns false when the URL cannot be opened. */
export async function openPlaceInMaps(place: Place): Promise<boolean> {
  const url = buildPlaceMapsUrl(place);
  try {
    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error(`[Maps] Failed to open place "${place.name}":`, error);
    return false;
  }
}
