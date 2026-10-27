/**
 * Built-in category keys. The authoritative taxonomy lives in the
 * `place_categories` table, so runtime values are plain strings — never assume
 * this union covers every category a place can have.
 */
export type PlaceCategory =
  | 'food'
  | 'cafe'
  | 'nightlife'
  | 'chill'
  | 'study'
  | 'work'
  | 'gym'
  | 'shopping'
  | 'health'
  | 'services'
  | 'school'
  | 'recreation'
  | 'church'
  | 'mosque';

export type PriceRange = 1 | 2 | 3;

export type PlaceOpenStatus = 'open' | 'closed' | 'unknown';

export type Place = {
  id: string;
  name: string;
  /** DB-driven category key. Resolve display metadata via `getPlaceCategoryMeta`. */
  category: string;
  area: string;
  city: string;
  address: string;
  description: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  priceRange: PriceRange;
  rating: number;
  ratingCount: number;
  tags: string[];
  hours: string;
  openStatus: PlaceOpenStatus;
  verified: boolean;
  featured: boolean;
  phone?: string;
  /** Local asset from /dummy/images/places. Falls back to a designed placeholder when absent. */
  image?: number;
  /** Comma-separated URIs of images selected for this place (client-side only for now). */
  images?: string;
  /** Who created this place. */
  creatorId?: string;
  creatorUsername?: string | null;
  creatorName?: string | null;
  creatorAvatarUrl?: string | null;
};

export type PlaceReview = {
  id: string;
  placeId: string;
  author: string;
  initials: string;
  rating: number;
  text: string;
  createdAt: string;
};

export type NewPlaceReview = {
  rating: number;
  text: string;
};

/** Editable fields used by the Add a place form. */
export type PlaceDraft = {
  name: string;
  /** DB-driven category key selected from the category picker. */
  category: string;
  area: string;
  address: string;
  description: string;
  latitude?: number;
  longitude?: number;
};

export type PlaceDraftErrors = Partial<Record<keyof PlaceDraft, string>>;