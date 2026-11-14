import type { SlotCredit } from '@/types/liquidity';
import { isEndedStatus } from './credit-status';

export type CtaIcon =
  | 'enter-outline'
  | 'checkmark-circle-outline'
  | 'people-outline'
  | 'time-outline'
  | 'card-outline'
  | 'mail-open-outline'
  | 'close-circle-outline'
  | 'search-outline';

export type CtaAction =
  | { type: 'claim' }
  | { type: 'solo-claim' }
  | { type: 'view-booking'; creditId: string }
  | { type: 'open-household'; creditId: string }
  | { type: 'pay'; creditId: string }
  | { type: 'open-invite' }
  | { type: 'cancel'; creditId: string }
  | { type: 'browse' }
  | { type: 'none' };

/** Which situation the student is in; drives the bottom bar's wording and styling. */
export type CtaState = 'loading' | 'reserve' | 'full' | 'rejected' | 'invite' | 'review' | 'pay' | 'household' | 'booking';

export type PropertyCta = { label: string; icon: CtaIcon; action: CtaAction; state: CtaState };

type CreditInput = Pick<SlotCredit, 'id' | 'status' | 'target_occupancy' | 'pod_verification_status'>;

type CtaInput = {
  credit: CreditInput | null | undefined;
  hasInvitation: boolean;
  /** True until both the credit and invitation queries have settled. */
  isLoading: boolean;
  isSingleOccupancy: boolean;
  /** True when no spots are left; only blocks a student who has no reservation or invite. */
  isFull?: boolean;
};

const PAID_STATUSES: SlotCredit['status'][] = ['paid_unmatched', 'matched', 'subletting'];

/** Decides what the property page's main button says and does for this student. */
export function resolvePropertyCta({ credit, hasInvitation, isLoading, isSingleOccupancy, isFull = false }: CtaInput): PropertyCta {
  if (isLoading && !credit && !hasInvitation) {
    return { label: '', icon: 'enter-outline', action: { type: 'none' }, state: 'loading' };
  }

  const isRejected = credit?.pod_verification_status === 'rejected';
  const isClaimable = !credit || isEndedStatus(credit.status);

  // A rejected request still holds its spot until the hold lapses, so re-reserving here would only fail.
  if (credit && !isClaimable && isRejected && !PAID_STATUSES.includes(credit.status)) {
    return { label: 'Find another place', icon: 'search-outline', action: { type: 'browse' }, state: 'rejected' };
  }

  if (credit && !isClaimable) {
    if (PAID_STATUSES.includes(credit.status)) {
      return credit.target_occupancy === 1
        ? { label: 'View booking', icon: 'checkmark-circle-outline', action: { type: 'view-booking', creditId: credit.id }, state: 'booking' }
        : { label: 'Open household', icon: 'people-outline', action: { type: 'open-household', creditId: credit.id }, state: 'household' };
    }
    if (credit.pod_verification_status === 'pending_verification') {
      return { label: 'Cancel request', icon: 'close-circle-outline', action: { type: 'cancel', creditId: credit.id }, state: 'review' };
    }
    return {
      label: credit.target_occupancy === 1 ? 'Pay now' : 'Pay my share',
      icon: 'card-outline',
      action: { type: 'pay', creditId: credit.id },
      state: 'pay',
    };
  }

  if (hasInvitation) {
    return { label: 'View invite', icon: 'mail-open-outline', action: { type: 'open-invite' }, state: 'invite' };
  }

  if (isFull) {
    return { label: 'Fully booked', icon: 'time-outline', action: { type: 'none' }, state: 'full' };
  }

  return {
    label: 'Reserve a spot',
    icon: 'enter-outline',
    action: { type: isSingleOccupancy ? 'solo-claim' : 'claim' },
    state: 'reserve',
  };
}

/** True once the student has paid for their spot (solo or shared). */
export function isCreditPaid(credit: Pick<SlotCredit, 'status'> | null | undefined): boolean {
  return !!credit && PAID_STATUSES.includes(credit.status);
}
