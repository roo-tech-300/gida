import type { PlaceDraft, PriceRange } from '@/types/place';

export const PLACE_NAME_MAX = 60;
export const PLACE_AREA_MAX = 40;
export const PLACE_ADDRESS_MAX = 120;
export const PLACE_DESCRIPTION_MIN = 20;
export const PLACE_DESCRIPTION_MAX = 300;

export const EMPTY_PLACE_DRAFT: PlaceDraft = {
  name: '',
  category: 'food',
  area: '',
  address: '',
  priceRange: 2,
  description: '',
  latitude: undefined,
  longitude: undefined,
};

export const PRICE_RANGE_OPTIONS: { value: PriceRange; label: string; hint: string }[] = [
  { value: 1, label: '₦', hint: 'Budget' },
  { value: 2, label: '₦₦', hint: 'Mid-range' },
  { value: 3, label: '₦₦₦', hint: 'Premium' },
];
