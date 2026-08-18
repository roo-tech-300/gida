import { Linking } from 'react-native';

type OpenDirectionsArgs = {
  latitude?: number | null;
  longitude?: number | null;
  placeName: string;
  placeArea?: string;
};

export function openDirectionsInMaps({ latitude, longitude, placeName, placeArea }: OpenDirectionsArgs): void {
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const url = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([placeArea, placeName].filter(Boolean).join(', '))}`;
  Linking.openURL(url).catch((error) => {
    console.error('[Maps] Failed to open directions:', error);
  });
}
