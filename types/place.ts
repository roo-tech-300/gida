export type PlaceCategory =
  | 'food'
  | 'cafe'
  | 'nightlife'
  | 'chill'
  | 'study'
  | 'gym'
  | 'shopping'
  | 'health'
  | 'services';

export type PriceRange = 1 | 2 | 3;

export type PlaceOpenStatus = 'open' | 'closed' | 'unknown';

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
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
  /** Comma‑separated URIs of images selected for this place (client‑side only for now). */
  images?: string;
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

/** Editable fields used by the "Add a place" form. */
export type PlaceDraft = {
  name: string;
  category: PlaceCategory;
  area: string;
  address: string;
  priceRange: PriceRange;
  description: string;
  latitude?: number;
  longitude?: number;
};

export type PlaceDraftErrors = Partial<Record<keyof PlaceDraft, string>>;
