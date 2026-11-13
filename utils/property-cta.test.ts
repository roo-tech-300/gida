import { resolvePropertyCta } from './property-cta';

const base = { hasInvitation: false, isLoading: false, isSingleOccupancy: false };
const credit = (over: Record<string, unknown>) =>
  ({ id: 'c1', status: 'booked', target_occupancy: 3, pod_verification_status: null, ...over }) as never;

describe('resolvePropertyCta', () => {
  it('shows a blank button while loading', () => {
    expect(resolvePropertyCta({ ...base, credit: null, isLoading: true }).label).toBe('');
  });

  it('offers to reserve, going to solo claim for single-occupancy lodges', () => {
    expect(resolvePropertyCta({ ...base, credit: null }).action).toEqual({ type: 'claim' });
    expect(resolvePropertyCta({ ...base, credit: null, isSingleOccupancy: true }).action).toEqual({ type: 'solo-claim' });
  });

  it('shows the invitation when there is no active credit', () => {
    expect(resolvePropertyCta({ ...base, credit: null, hasInvitation: true })).toMatchObject({ label: "You're Invited", action: { type: 'open-invite' } });
  });

  it('routes paid credits to the booking or household', () => {
    expect(resolvePropertyCta({ ...base, credit: credit({ status: 'matched', target_occupancy: 1 }) }).action).toEqual({ type: 'view-booking', creditId: 'c1' });
    expect(resolvePropertyCta({ ...base, credit: credit({ status: 'paid_unmatched' }) }).action).toEqual({ type: 'open-household', creditId: 'c1' });
  });

  it('asks to pay an unpaid reservation, or waits during review', () => {
    expect(resolvePropertyCta({ ...base, credit: credit({}) })).toMatchObject({ label: 'Pay now', action: { type: 'pay' } });
    expect(resolvePropertyCta({ ...base, credit: credit({ pod_verification_status: 'pending_verification' }) })).toMatchObject({ label: 'Under review', action: { type: 'none' } });
  });

  it('lets a student reserve again after an expired or rejected reservation', () => {
    expect(resolvePropertyCta({ ...base, credit: credit({ status: 'expired' }) }).label).toBe('Reserve');
    expect(resolvePropertyCta({ ...base, credit: credit({ pod_verification_status: 'rejected' }) }).label).toBe('Reserve');
  });
});
