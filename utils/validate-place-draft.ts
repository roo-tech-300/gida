import {
  PLACE_ADDRESS_MAX,
  PLACE_AREA_MAX,
  PLACE_DESCRIPTION_MAX,
  PLACE_DESCRIPTION_MIN,
  PLACE_NAME_MAX,
} from '@/constants/place-form';
import type { PlaceDraft, PlaceDraftErrors } from '@/types/place';

export function validateBasicStep(draft: PlaceDraft): PlaceDraftErrors {
  const errors: PlaceDraftErrors = {};

  const name = draft.name.trim();
  if (name.length < 3) {
    errors.name = 'Give the place a name (at least 3 characters).';
  } else if (name.length > PLACE_NAME_MAX) {
    errors.name = `Keep the name under ${PLACE_NAME_MAX} characters.`;
  }

  const area = draft.area.trim();
  if (area.length < 2) {
    errors.area = 'Add the area or neighbourhood (e.g. Gidan Kwano).';
  } else if (area.length > PLACE_AREA_MAX) {
    errors.area = `Keep the area under ${PLACE_AREA_MAX} characters.`;
  }

  const address = draft.address.trim();
  if (address.length > 0 && address.length < 6) {
    errors.address = 'Street address should be at least 6 characters.';
  } else if (address.length > PLACE_ADDRESS_MAX) {
    errors.address = `Keep the address under ${PLACE_ADDRESS_MAX} characters.`;
  }

  const description = draft.description.trim();
  if (description.length < PLACE_DESCRIPTION_MIN) {
    errors.description = `Write at least ${PLACE_DESCRIPTION_MIN} characters so people know what to expect.`;
  } else if (description.length > PLACE_DESCRIPTION_MAX) {
    errors.description = `Keep the description under ${PLACE_DESCRIPTION_MAX} characters.`;
  }

  return errors;
}

export function validatePlaceDraft(draft: PlaceDraft): PlaceDraftErrors {
  const errors = validateBasicStep(draft);

  if (draft.latitude != null && (draft.latitude < -90 || draft.latitude > 90)) {
    errors.latitude = 'Latitude must be between -90 and 90.';
  }
  if (draft.longitude != null && (draft.longitude < -180 || draft.longitude > 180)) {
    errors.longitude = 'Longitude must be between -180 and 180.';
  }

  return errors;
}
