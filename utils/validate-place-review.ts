export type ReviewField = 'rating' | 'text';

export type ReviewValidationError = { field: ReviewField; message: string } | null;

const MIN_RATING = 1;
const MIN_TEXT_LENGTH = 1;

/**
 * Pure validation for the place review form. Returns the first blocking error so
 * the UI can surface it inline instead of silently ignoring the submit tap.
 */
export function validatePlaceReview(rating: number, text: string): ReviewValidationError {
  if (rating < MIN_RATING) {
    return { field: 'rating', message: 'Please select a star rating before submitting.' };
  }

  if (text.trim().length < MIN_TEXT_LENGTH) {
    return { field: 'text', message: 'Please write a short review before submitting.' };
  }

  return null;
}
