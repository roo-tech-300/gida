import { Ionicons } from '@expo/vector-icons';

export type PlaceCategoryMeta = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
};

/**
 * Offline/initial-render defaults only. The authoritative list lives in the
 * `place_categories` table and is loaded through `useInfiniteCategories`.
 */
export const PLACE_CATEGORIES: readonly PlaceCategoryMeta[] = [
  { key: 'food', label: 'Food', icon: 'restaurant-outline', accent: '#C97B3C' },
  { key: 'cafe', label: 'Cafés', icon: 'cafe-outline', accent: '#B98A5A' },
  { key: 'nightlife', label: 'Nightlife', icon: 'wine-outline', accent: '#8A6BC9' },
  { key: 'chill', label: 'Chill Spots', icon: 'leaf-outline', accent: '#4FA88B' },
  { key: 'study', label: 'Study Spots', icon: 'book-outline', accent: '#6B8FD1' },
  { key: 'work', label: 'Work Place', icon: 'briefcase-outline', accent: '#6B8FD1' },
  { key: 'gym', label: 'Gyms', icon: 'barbell-outline', accent: '#C96B6B' },
  { key: 'shopping', label: 'Shopping', icon: 'bag-handle-outline', accent: '#C9A06B' },
  { key: 'health', label: 'Health', icon: 'medkit-outline', accent: '#5FAFA0' },
  { key: 'services', label: 'Services', icon: 'construct-outline', accent: '#9A9AA8' },
  { key: 'school', label: 'School Buildings', icon: 'school-outline', accent: '#5B7FBF' },
  { key: 'recreation', label: 'Recreation Centers', icon: 'football-outline', accent: '#D98A4E' },
  { key: 'church', label: 'Churches', icon: 'add-outline', accent: '#A0789C' },
  { key: 'mosque', label: 'Mosques', icon: 'moon-outline', accent: '#4E9A7A' },
];

export const PLACE_CATEGORY_MAP: Record<string, PlaceCategoryMeta> =
  PLACE_CATEGORIES.reduce<Record<string, PlaceCategoryMeta>>((map, meta) => {
    map[meta.key] = meta;
    return map;
  }, {});

const FALLBACK_ACCENT = '#9A9AA8';
const FALLBACK_ICON: keyof typeof Ionicons.glyphMap = 'grid-outline';

/** Turns an unknown DB key such as `recreation_center` into `Recreation Center`. */
export function formatPlaceCategoryLabel(key: string): string {
  const words = key
    .trim()
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 'Uncategorized';

  return words.map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Safe lookup for any category value coming from the database. Categories are
 * DB-driven, so a key may not exist in the static defaults yet — this never
 * returns `undefined` and keeps UI rendering instead of throwing.
 */
export function getPlaceCategoryMeta(key: string | null | undefined): PlaceCategoryMeta {
  const normalized = key?.trim();

  if (normalized) {
    const match = PLACE_CATEGORY_MAP[normalized];
    if (match) return match;
  }

  return {
    key: normalized || 'uncategorized',
    label: normalized ? formatPlaceCategoryLabel(normalized) : 'Uncategorized',
    icon: FALLBACK_ICON,
    accent: FALLBACK_ACCENT,
  };
}
