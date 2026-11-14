import type { SlotCredit } from '@/types/liquidity';
import { isEndedStatus } from '@/utils/credit-status';

export type ReservationStage = 'under_review' | 'awaiting_payment' | 'paid' | 'not_approved' | 'expired' | 'cancelled';
export type StepState = 'done' | 'current' | 'todo';

export interface ProgressStep {
  label: string;
  state: StepState;
}

const PAID_STATUSES: SlotCredit['status'][] = ['paid_unmatched', 'matched', 'subletting'];
const STEP_LABELS = ['Reserved', 'Approved', 'Paid', 'Move in'] as const;

// Which reservation to feature first: money owed beats waiting, waiting beats done.
const STAGE_PRIORITY: Record<ReservationStage, number> = {
  awaiting_payment: 0,
  under_review: 1,
  paid: 2,
  not_approved: 3,
  expired: 4,
  cancelled: 4,
};

export function reservationStage(credit: SlotCredit): ReservationStage {
  if (credit.status === 'expired') return 'expired';
  if (credit.status === 'cancelled') return 'cancelled';
  if (PAID_STATUSES.includes(credit.status)) return 'paid';
  if (credit.pod_verification_status === 'rejected') return 'not_approved';
  if (credit.pod_verification_status === 'pending_verification') return 'under_review';
  return 'awaiting_payment';
}

/** Index of the step the student is on right now (0 = Reserved … 3 = Move in). */
function currentStepIndex(stage: ReservationStage): number {
  switch (stage) {
    case 'under_review':
    case 'not_approved':
      return 1;
    case 'awaiting_payment':
      return 2;
    case 'paid':
      return 3;
    case 'expired':
    case 'cancelled':
      return 0;
  }
}

/** True once the reservation is over, whether the hold lapsed or the student cancelled. */
export function isEndedStage(stage: ReservationStage): boolean {
  return stage === 'expired' || stage === 'cancelled';
}

export function progressSteps(stage: ReservationStage): ProgressStep[] {
  const current = currentStepIndex(stage);
  return STEP_LABELS.map((label, index) => ({
    label,
    state: index < current ? 'done' : index === current ? 'current' : 'todo',
  }));
}

export function pickPrimaryReservation(credits: SlotCredit[] | undefined): SlotCredit | null {
  const live = (credits ?? []).filter((credit) => !isEndedStatus(credit.status));
  if (live.length === 0) return null;
  return [...live].sort((a, b) => {
    const byStage = STAGE_PRIORITY[reservationStage(a)] - STAGE_PRIORITY[reservationStage(b)];
    if (byStage !== 0) return byStage;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })[0];
}

/** "Fri 14 Nov, 6:00 pm": a date a parent can act on, never "72h". */
export function formatHoldDeadline(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  return `${day}, ${time}`;
}

export function spotLabel(credit: SlotCredit): string {
  return credit.target_occupancy > 1
    ? `Your spot: 1 of ${credit.target_occupancy}`
    : 'The whole place, just you';
}
