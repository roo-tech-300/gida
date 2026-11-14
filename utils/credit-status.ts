import type { SlotCredit } from '@/types/liquidity';

type Status = SlotCredit['status'];

/** Statuses where the reservation is over and no longer holds a spot: lapsed ('expired') or withdrawn ('cancelled'). */
export const ENDED_STATUSES: readonly Status[] = ['expired', 'cancelled'];

/** Postgrest `not.in` list matching ENDED_STATUSES, e.g. `.not('status', 'in', ENDED_STATUS_FILTER)`. */
export const ENDED_STATUS_FILTER = `(${ENDED_STATUSES.join(',')})`;

export function isEndedStatus(status: Status | null | undefined): boolean {
  return !!status && ENDED_STATUSES.includes(status);
}

/** Unpaid reservations can still be cancelled by the student; paid ones need a refund decision. */
export function canCancelStatus(status: Status | null | undefined): boolean {
  return status === 'booked' || status === 'booked_pending_claim';
}
