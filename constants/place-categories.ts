import { Ionicons } from '@expo/vector-icons';

import type { PlaceCategory } from '@/types/place';

export type PlaceCategoryMeta = {
  key: PlaceCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
};

export const PLACE_CATEGORIES: readonly PlaceCategoryMeta[] = [
  { key: 'food', label: 'Food', icon: 'restaurant-outline', accent: '#C97B3C' },
  { key: 'cafe', label: 'Cafés', icon: 'cafe-outline', accent: '#B98A5A' },
  { key: 'nightlife', label: 'Nightlife', icon: 'wine-outline', accent: '#8A6BC9' },
  { key: 'chill', label: 'Chill Spots', icon: 'leaf-outline', accent: '#4FA88B' },
  { key: 'study', label: 'Study Spots', icon: 'book-outline', accent: '#6B8FD1' },
  { key: 'gym', label: 'Gyms', icon: 'barbell-outline', accent: '#C96B6B' },
  { key: 'shopping', label: 'Shopping', icon: 'bag-handle-outline', accent: '#C9A06B' },
  { key: 'health', label: 'Health', icon: 'medkit-outline', accent: '#5FAFA0' },
  { key: 'services', label: 'Services', icon: 'construct-outline', accent: '#9A9AA8' },
];

export const PLACE_CATEGORY_MAP = PLACE_CATEGORIES.reduce<Record<PlaceCategory, PlaceCategoryMeta>>(
  (map, meta) => {
    map[meta.key] = meta;
    return map;
  },
  {} as Record<PlaceCategory, PlaceCategoryMeta>,
);
