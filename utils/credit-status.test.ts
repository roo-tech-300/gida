import { canCancelStatus, ENDED_STATUS_FILTER, isEndedStatus } from './credit-status';

describe('credit status helpers', () => {
  it('treats expired and cancelled as ended, and everything else as live', () => {
    expect(isEndedStatus('expired')).toBe(true);
    expect(isEndedStatus('cancelled')).toBe(true);
    expect(isEndedStatus('booked_pending_claim')).toBe(false);
    expect(isEndedStatus('paid_unmatched')).toBe(false);
    expect(isEndedStatus(undefined)).toBe(false);
  });

  it('lets only unpaid reservations be cancelled', () => {
    expect(canCancelStatus('booked')).toBe(true);
    expect(canCancelStatus('booked_pending_claim')).toBe(true);
    for (const paid of ['paid_unmatched', 'matched', 'subletting', 'expired', 'cancelled'] as const) {
      expect(canCancelStatus(paid)).toBe(false);
    }
  });

  it('builds the postgrest filter list', () => {
    expect(ENDED_STATUS_FILTER).toBe('(expired,cancelled)');
  });
});
