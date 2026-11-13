import type { SlotCredit } from '@/types/liquidity';

export type CtaIcon =
  | 'enter-outline'
  | 'checkmark-circle-outline'
  | 'people-outline'
  | 'time-outline'
  | 'card-outline'
  | 'mail-open-outline';

export type CtaAction =
  | { type: 'claim' }
  | { type: 'solo-claim' }
  | { type: 'view-booking'; creditId: string }
  | { type: 'open-household'; creditId: string }
  | { type: 'pay'; creditId: string }
  | { type: 'open-invite' }
  | { type: 'none' };

export type PropertyCta = { label: string; icon: CtaIcon; action: CtaAction };

type CreditInput = Pick<SlotCredit, 'id' | 'status' | 'target_occupancy' | 'pod_verification_status'>;

type CtaInput = {
  credit: CreditInput | null | undefined;
  hasInvitation: boolean;
  /** True until both the credit and invitation queries have settled. */
  isLoading: boolean;
  isSingleOccupancy: boolean;
};

const PAID_STATUSES: SlotCredit['status'][] = ['paid_unmatched', 'matched', 'subletting'];

/** Decides what the property page's main button says and does for this student. */
export function resolvePropertyCta({ credit, hasInvitation, isLoading, isSingleOccupancy }: CtaInput): PropertyCta {
  if (isLoading && !credit && !hasInvitation) {
    return { label: '', icon: 'enter-outline', action: { type: 'none' } };
  }

  const isRejected = credit?.pod_verification_status === 'rejected';
  const isClaimable = !credit || credit.status === 'expired' || isRejected;

  if (credit && !isClaimable) {
    if (PAID_STATUSES.includes(credit.status)) {
      return credit.target_occupancy === 1
        ? { label: 'View booking', icon: 'checkmark-circle-outline', action: { type: 'view-booking', creditId: credit.id } }
        : { label: 'Open household', icon: 'people-outline', action: { type: 'open-household', creditId: credit.id } };
    }
    if (credit.pod_verification_status === 'pending_verification') {
      return { label: 'Under review', icon: 'time-outline', action: { type: 'none' } };
    }
    return { label: 'Pay now', icon: 'card-outline', action: { type: 'pay', creditId: credit.id } };
  }

  if (hasInvitation) {
    return { label: "You're Invited", icon: 'mail-open-outline', action: { type: 'open-invite' } };
  }

  return { label: 'Reserve', icon: 'enter-outline', action: { type: isSingleOccupancy ? 'solo-claim' : 'claim' } };
}

/** True once the student has paid for their spot (solo or shared). */
export function isCreditPaid(credit: Pick<SlotCredit, 'status'> | null | undefined): boolean {
  return !!credit && PAID_STATUSES.includes(credit.status);
}
