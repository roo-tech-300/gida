import type { PropertyCta } from './property-cta';
import { formatNaira } from './format-naira';

/** price: gold amount · warn: amber second line · paid: green amount · neutral: plain text. */
export type BarTone = 'price' | 'warn' | 'paid' | 'neutral';

export type BarSummary = { primary: string; secondary: string; tone: BarTone };

type Input = {
  cta: Pick<PropertyCta, 'state' | 'action'>;
  pricePerPerson: number;
  /** The share locked into the student's reservation; what they will actually be charged. Preferred over the listing price. */
  amountDue?: number | null;
  /** Household size of the student's reservation, when they have one. */
  targetOccupancy?: number | null;
  /** ISO time the payment hold ends, when the student has a reservation. */
  paymentDeadline?: string | null;
  now?: Date;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** "Hold ends in 2 days", "Hold ends in 5 hours" or "Hold has ended". Empty when there is no deadline. */
export function holdCountdown(deadline: string | null | undefined, now: Date = new Date()): string {
  if (!deadline) return '';
  const end = new Date(deadline).getTime();
  if (Number.isNaN(end)) return '';
  const left = end - now.getTime();
  if (left <= 0) return 'Hold has ended';
  if (left >= DAY_MS) {
    const days = Math.floor(left / DAY_MS);
    return `Hold ends in ${days} ${days === 1 ? 'day' : 'days'}`;
  }
  const hours = Math.floor(left / HOUR_MS);
  if (hours >= 1) return `Hold ends in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return 'Hold ends within the hour';
}

/** The two lines on the left of the property page's bottom bar, chosen by the student's situation. */
export function resolveBarSummary({ cta, pricePerPerson, amountDue, targetOccupancy, paymentDeadline, now }: Input): BarSummary {
  const price = formatNaira(pricePerPerson);
  const reserved = formatNaira(amountDue && amountDue > 0 ? amountDue : pricePerPerson);
  switch (cta.state) {
    case 'pay':
      return { primary: `${reserved} due`, secondary: holdCountdown(paymentDeadline, now), tone: 'warn' };
    case 'household':
      return { primary: `Household of ${targetOccupancy ?? 'the group'}`, secondary: 'Your share is paid', tone: 'paid' };
    case 'booking':
      return { primary: 'Paid', secondary: `${reserved} · receipt in Support`, tone: 'paid' };
    case 'rejected':
      return { primary: 'Not approved', secondary: 'You have not been charged', tone: 'neutral' };
    case 'invite':
      return { primary: "You're invited", secondary: 'to join a household here', tone: 'neutral' };
    case 'review':
      return { primary: 'Request sent', secondary: 'Waiting for review', tone: 'neutral' };
    case 'full':
      return { primary: price, secondary: 'No spots left', tone: 'neutral' };
    case 'reserve':
    case 'loading':
    default:
      return {
        primary: price,
        secondary: cta.action.type === 'solo-claim' ? 'per year' : 'per person · year',
        tone: 'price',
      };
  }
}
