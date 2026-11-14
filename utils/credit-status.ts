import type { SlotCredit } from '@/types/liquidity';

type Status = SlotCredit['status'];

/** Statuses where the reservation no longer holds a spot: hold lapsed, student cancelled, or admin rejected. */
export const ENDED_STATUSES: readonly Status[] = ['expired', 'cancelled', 'rejected'];

/** Postgrest `not.in` list matching ENDED_STATUSES, e.g. `.not('status', 'in', ENDED_STATUS_FILTER)`. */
export const ENDED_STATUS_FILTER = `(${ENDED_STATUSES.join(',')})`;

export function isEndedStatus(status: Status | null | undefined): boolean {
  return !!status && ENDED_STATUSES.includes(status);
}

/**
 * Ended with nothing left to tell the student: the hold lapsed or they cancelled it themselves.
 * A rejected request is ended too, but they still need to see why, so it is not "lapsed".
 */
export function isLapsedStatus(status: Status | null | undefined): boolean {
  return status === 'expired' || status === 'cancelled';
}

/** Unpaid reservations can still be cancelled by the student; paid ones need a refund decision. */
export function canCancelStatus(status: Status | null | undefined): boolean {
  return status === 'booked' || status === 'booked_pending_claim';
}
