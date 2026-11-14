import type { SlotCredit } from '@/types/liquidity';
import {
  formatHoldDeadline, isEndedStage, pickPrimaryReservation, progressSteps, reservationStage, spotLabel,
} from './reservation-state';

function credit(overrides: Partial<SlotCredit>): SlotCredit {
  return {
    id: 'c1', user_id: 'u1', estate_id: 'e1', property_tier: 4, intent_size: 1, target_occupancy: 4,
    status: 'booked_pending_claim', created_at: '2026-11-10T10:00:00.000Z', payment_deadline: '2026-11-14T10:00:00.000Z',
    ...overrides,
  };
}

describe('reservationStage', () => {
  it('treats an unpaid, approved reservation as awaiting payment', () => {
    expect(reservationStage(credit({ pod_verification_status: 'approved' }))).toBe('awaiting_payment');
  });
  it('treats a reservation the admin has not approved yet as under review', () => {
    expect(reservationStage(credit({ pod_verification_status: 'pending_verification' }))).toBe('under_review');
  });
  it('lets payment win over verification status', () => {
    expect(reservationStage(credit({ status: 'paid_unmatched', pod_verification_status: 'approved' }))).toBe('paid');
  });
  it('flags rejected and expired reservations', () => {
    expect(reservationStage(credit({ pod_verification_status: 'rejected' }))).toBe('not_approved');
    expect(reservationStage(credit({ status: 'expired' }))).toBe('expired');
    expect(reservationStage(credit({ status: 'cancelled' }))).toBe('cancelled');
  });
});

describe('progressSteps', () => {
  it('marks earlier steps done and the current step current', () => {
    expect(progressSteps('awaiting_payment').map((s) => s.state)).toEqual(['done', 'done', 'current', 'todo']);
    expect(progressSteps('under_review').map((s) => s.state)).toEqual(['done', 'current', 'todo', 'todo']);
    expect(progressSteps('paid').map((s) => s.state)).toEqual(['done', 'done', 'done', 'current']);
  });
});

describe('pickPrimaryReservation', () => {
  it('returns null when there is nothing live', () => {
    expect(pickPrimaryReservation(undefined)).toBeNull();
    expect(pickPrimaryReservation([credit({ status: 'expired' })])).toBeNull();
  });
  it('features money owed before a finished booking', () => {
    const paid = credit({ id: 'paid', status: 'paid_unmatched' });
    const owed = credit({ id: 'owed', pod_verification_status: 'approved' });
    expect(pickPrimaryReservation([paid, owed])?.id).toBe('owed');
  });
  it('breaks ties with the newest reservation', () => {
    const older = credit({ id: 'older', created_at: '2026-11-01T00:00:00.000Z' });
    const newer = credit({ id: 'newer', created_at: '2026-11-09T00:00:00.000Z' });
    expect(pickPrimaryReservation([older, newer])?.id).toBe('newer');
  });
});

describe('copy helpers', () => {
  it('words the spot for groups and solo bookings', () => {
    expect(spotLabel(credit({ target_occupancy: 4 }))).toBe('Your spot: 1 of 4');
    expect(spotLabel(credit({ target_occupancy: 1 }))).toBe('The whole place, just you');
  });
  it('formats the hold deadline as a day and time', () => {
    expect(formatHoldDeadline('2026-11-14T17:00:00')).toMatch(/^\w{3} 14 Nov, 5:00 pm$/);
  });
});

describe('ended reservations', () => {
  it('counts both lapsed and cancelled reservations as ended', () => {
    expect(isEndedStage('expired')).toBe(true);
    expect(isEndedStage('cancelled')).toBe(true);
    expect(isEndedStage('under_review')).toBe(false);
  });

  it('never features a cancelled reservation on My Home', () => {
    const live = credit({ id: 'live', status: 'booked_pending_claim', pod_verification_status: 'approved' });
    const cancelled = credit({ id: 'gone', status: 'cancelled', created_at: '2026-11-13T10:00:00.000Z' });
    expect(pickPrimaryReservation([cancelled, live])?.id).toBe('live');
    expect(pickPrimaryReservation([cancelled])).toBeNull();
  });
});
