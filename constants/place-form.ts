import type { PlaceDraft } from '@/types/place';

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
  description: '',
  latitude: undefined,
  longitude: undefined,
};