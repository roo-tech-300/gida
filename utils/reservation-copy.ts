import type { Href } from 'expo-router';

import type { SlotCredit } from '@/types/liquidity';
import { formatNaira } from '@/utils/format-naira';
import { formatHoldDeadline, type ReservationStage } from '@/utils/reservation-state';

export interface NextStepCopy {
  title: string;
  body: string;
  ctaLabel: string;
  href: Href;
  /** Show the "held until" strip. */
  showHold: boolean;
  tone: 'action' | 'waiting' | 'done' | 'problem';
}

/** What the My Home card says for each stage. Only promises what the backend does today. */
export function nextStepCopy(credit: SlotCredit, stage: ReservationStage): NextStepCopy {
  const isSolo = credit.target_occupancy === 1;
  const amount = credit.amount_paid ? formatNaira(credit.amount_paid) : null;

  switch (stage) {
    case 'awaiting_payment':
      return {
        title: amount ? `Pay ${amount} to keep your spot` : 'Pay to keep your spot',
        body: `Your spot is held until ${formatHoldDeadline(credit.payment_deadline)}.`,
        ctaLabel: 'Pay now',
        href: { pathname: '/property/pay-slot', params: { id: credit.id } },
        showHold: true,
        tone: 'action',
      };
    case 'under_review':
      return {
        title: 'Gida is reviewing your request',
        body: 'We will message you here the moment it is approved. Nothing is charged yet.',
        ctaLabel: 'See your request',
        href: { pathname: '/property/pay-slot', params: { id: credit.id } },
        showHold: false,
        tone: 'waiting',
      };
    case 'paid':
      return isSolo
        ? {
            title: 'You are all set',
            body: 'Your spot is paid for. Keep your booking handy for move-in day.',
            ctaLabel: 'View booking',
            href: { pathname: '/property/booking', params: { id: credit.id } },
            showHold: false,
            tone: 'done',
          }
        : {
            title: 'Your share is paid',
            body: 'Your household is filling up. Chat with your roommates and plan move-in.',
            ctaLabel: 'Open household',
            href: { pathname: '/property/lobby', params: { creditId: credit.id } },
            showHold: false,
            tone: 'done',
          };
    case 'not_approved':
      return {
        title: 'This request was not approved',
        body: 'You have not been charged. You can reserve another place.',
        ctaLabel: 'Find another place',
        href: '/(tabs)',
        showHold: false,
        tone: 'problem',
      };
    case 'expired':
      return {
        title: 'This hold has ended',
        body: 'The payment window passed, so the spot was released. You can reserve it again.',
        ctaLabel: credit.listing_id ? 'Reserve again' : 'Find a place',
        href: credit.listing_id ? { pathname: '/property/[id]', params: { id: credit.listing_id } } : '/(tabs)',
        showHold: false,
        tone: 'problem',
      };
  }
}
