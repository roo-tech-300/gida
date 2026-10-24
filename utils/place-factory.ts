import type { Place, PlaceDraft } from '@/types/place';

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildPlaceFromDraft(draft: PlaceDraft): Place {
  const slug = slugify(draft.name) || 'place';

  return {
    id: `${slug}-${Date.now()}`,
    name: draft.name.trim(),
    category: draft.category,
    area: draft.area.trim(),
    city: 'Minna',
    address: draft.address.trim(),
    description: draft.description.trim(),
    latitude: draft.latitude,
    longitude: draft.longitude,
    priceRange: draft.priceRange,
    rating: 0,
    ratingCount: 0,
    tags: [],
    hours: 'Hours not confirmed',
    openStatus: 'unknown',
    verified: false,
    featured: false,
    images: '', // will be overwritten by the caller if images are selected
  };
}
