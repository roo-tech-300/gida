const GENERIC = 'We could not cancel your request. Please try again.';

/** Turns a cancel_reservation failure into words a student can act on. */
export function cancelErrorMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : '';
  if (text.includes('ALREADY_PAID')) {
    return 'This reservation has already been paid, so it cannot be cancelled here. Message Gida Support and we will help.';
  }
  if (text.includes('RESERVATION_NOT_FOUND')) return 'We could not find that reservation.';
  if (text.includes('still processing')) {
    return 'A payment for this reservation is still going through. Wait a few minutes and try again if you did not pay.';
  }
  if (text.includes('NOT_SIGNED_IN')) return 'Please sign in again to cancel your request.';
  return GENERIC;
}
