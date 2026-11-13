import { blockingReserveMessage, shouldRefreshAvailability } from './tour-reserve-errors';

describe('tour reserve errors', () => {
  it('blocks on every terminal error with a message', () => {
    for (const code of ['slot_full', 'admin_unavailable', 'tours_disabled', 'no_location', 'listing_not_found'] as const) {
      expect(blockingReserveMessage(code)).toEqual(expect.any(String));
    }
  });

  it('lets already_booked, failed and success continue to the next step', () => {
    expect(blockingReserveMessage('already_booked')).toBeNull();
    expect(blockingReserveMessage('failed')).toBeNull();
    expect(blockingReserveMessage(undefined)).toBeNull();
  });

  it('refreshes availability only when the slot data is stale', () => {
    expect(shouldRefreshAvailability('slot_full')).toBe(true);
    expect(shouldRefreshAvailability('admin_unavailable')).toBe(true);
    expect(shouldRefreshAvailability('tours_disabled')).toBe(false);
  });
});
