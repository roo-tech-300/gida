import { resolvePropertyCta } from './property-cta';

const base = { hasInvitation: false, isLoading: false, isSingleOccupancy: false };
const credit = (over: Record<string, unknown>) =>
  ({ id: 'c1', status: 'booked', target_occupancy: 3, pod_verification_status: null, ...over }) as never;

describe('resolvePropertyCta', () => {
  it('shows a blank button while loading', () => {
    expect(resolvePropertyCta({ ...base, credit: null, isLoading: true })).toMatchObject({ label: '', state: 'loading' });
  });

  it('offers to reserve, going to solo claim for single-occupancy lodges', () => {
    expect(resolvePropertyCta({ ...base, credit: null }).action).toEqual({ type: 'claim' });
    expect(resolvePropertyCta({ ...base, credit: null, isSingleOccupancy: true }).action).toEqual({ type: 'solo-claim' });
  });

  it('shows the invitation when there is no active credit', () => {
    expect(resolvePropertyCta({ ...base, credit: null, hasInvitation: true })).toMatchObject({ label: 'View invite', state: 'invite', action: { type: 'open-invite' } });
  });

  it('routes paid credits to the booking or household', () => {
    expect(resolvePropertyCta({ ...base, credit: credit({ status: 'matched', target_occupancy: 1 }) }).action).toEqual({ type: 'view-booking', creditId: 'c1' });
    expect(resolvePropertyCta({ ...base, credit: credit({ status: 'paid_unmatched' }) }).action).toEqual({ type: 'open-household', creditId: 'c1' });
  });

  it('asks to pay an unpaid reservation, or offers to cancel while under review', () => {
    expect(resolvePropertyCta({ ...base, credit: credit({}) })).toMatchObject({ label: 'Pay my share', state: 'pay', action: { type: 'pay' } });
    expect(resolvePropertyCta({ ...base, credit: credit({ target_occupancy: 1 }) }).label).toBe('Pay now');
    expect(resolvePropertyCta({ ...base, credit: credit({ pod_verification_status: 'pending_verification' }) })).toMatchObject({ label: 'Cancel request', state: 'review', action: { type: 'cancel', creditId: 'c1' } });
  });

  it('blocks reserving a full lodge, but still lets an invited or reserved student in', () => {
    expect(resolvePropertyCta({ ...base, credit: null, isFull: true })).toMatchObject({ label: 'Fully booked', state: 'full', action: { type: 'none' } });
    expect(resolvePropertyCta({ ...base, credit: null, isFull: true, hasInvitation: true }).state).toBe('invite');
    expect(resolvePropertyCta({ ...base, credit: credit({}), isFull: true }).state).toBe('pay');
  });

  it('points a student with a rejected request to other places instead of a claim that would fail', () => {
    expect(resolvePropertyCta({ ...base, credit: credit({ pod_verification_status: 'rejected' }) })).toMatchObject({
      label: 'Find another place', state: 'rejected', action: { type: 'browse' },
    });
  });

  it('lets a student reserve again after an expired or rejected reservation', () => {
    expect(resolvePropertyCta({ ...base, credit: credit({ status: 'expired' }) }).label).toBe('Reserve a spot');
    expect(resolvePropertyCta({ ...base, credit: credit({ status: 'cancelled' }) }).label).toBe('Reserve a spot');
  });
});
