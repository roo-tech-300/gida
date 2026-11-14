import { holdCountdown, resolveBarSummary } from './property-bar-summary';

const now = new Date('2026-11-14T12:00:00Z');
const at = (ms: number) => new Date(now.getTime() + ms).toISOString();
const HOUR = 3600_000;

describe('holdCountdown', () => {
  it('counts whole days, then hours, then says the hold is ending or ended', () => {
    expect(holdCountdown(at(2 * 24 * HOUR + HOUR), now)).toBe('Hold ends in 2 days');
    expect(holdCountdown(at(25 * HOUR), now)).toBe('Hold ends in 1 day');
    expect(holdCountdown(at(5 * HOUR + 1000), now)).toBe('Hold ends in 5 hours');
    expect(holdCountdown(at(HOUR / 2), now)).toBe('Hold ends within the hour');
    expect(holdCountdown(at(-1000), now)).toBe('Hold has ended');
  });

  it('is empty without a usable deadline', () => {
    expect(holdCountdown(null, now)).toBe('');
    expect(holdCountdown('not a date', now)).toBe('');
  });
});

describe('resolveBarSummary', () => {
  const run = (state: string, extra: Record<string, unknown> = {}, action = 'claim') =>
    resolveBarSummary({ cta: { state, action: { type: action } } as never, pricePerPerson: 250000, now, ...extra });

  it('shows the price for a student who can reserve', () => {
    expect(run('reserve')).toEqual({ primary: '₦250,000', secondary: 'per person · year', tone: 'price' });
    expect(run('reserve', {}, 'solo-claim').secondary).toBe('per year');
    expect(run('loading').tone).toBe('price');
  });

  it('shows the amount due and the hold countdown when payment is pending', () => {
    expect(run('pay', { paymentDeadline: at(49 * HOUR) })).toEqual({ primary: '₦250,000 due', secondary: 'Hold ends in 2 days', tone: 'warn' });
  });

  it('shows the amount actually locked into the reservation, kobo included, rather than the listing price', () => {
    expect(run('pay', { amountDue: 333333.33, paymentDeadline: at(49 * HOUR) }).primary).toBe('₦333,333.33 due');
    expect(run('booking', { amountDue: 333333.33 }).secondary).toBe('₦333,333.33 · receipt in Support');
    expect(run('pay', { amountDue: 0, paymentDeadline: at(49 * HOUR) }).primary).toBe('₦250,000 due');
  });

  it('describes a paid household and a paid booking', () => {
    expect(run('household', { targetOccupancy: 4 })).toMatchObject({ primary: 'Household of 4', tone: 'paid' });
    expect(run('booking')).toMatchObject({ primary: 'Paid', secondary: '₦250,000 · receipt in Support', tone: 'paid' });
  });

  it('says there are no spots left on a full lodge', () => {
    expect(run('full')).toEqual({ primary: '₦250,000', secondary: 'No spots left', tone: 'neutral' });
  });

  it('explains a request that was not approved', () => {
    expect(run('rejected')).toMatchObject({ primary: 'Not approved', secondary: 'You have not been charged' });
  });

  it('describes an invite and a request under review', () => {
    expect(run('invite')).toMatchObject({ primary: "You're invited", tone: 'neutral' });
    expect(run('review')).toMatchObject({ primary: 'Request sent', secondary: 'Waiting for review' });
  });
});
