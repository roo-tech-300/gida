import type { ReserveTourResult } from '@/services/tour-booking-service';

type ReserveError = NonNullable<ReserveTourResult['error']>;

const BLOCKING_MESSAGES: Partial<Record<ReserveError, string>> = {
  slot_full: 'That time just filled up. Please pick another slot.',
  admin_unavailable: 'This admin is already guiding another tour at that time. Please pick a different slot.',
  tours_disabled: 'Tours are no longer available for this listing.',
  no_location: "This listing doesn't have a mapped location yet, so tours can't be scheduled.",
  listing_not_found: 'This listing is no longer available.',
};

/** Message for reservation errors that end the booking attempt, or null when the flow can continue. */
export function blockingReserveMessage(error: ReserveTourResult['error']): string | null {
  return error ? BLOCKING_MESSAGES[error] ?? null : null;
}

/** Errors that mean the shown availability is stale and should be refetched. */
export function shouldRefreshAvailability(error: ReserveTourResult['error']): boolean {
  return error === 'slot_full' || error === 'admin_unavailable';
}
