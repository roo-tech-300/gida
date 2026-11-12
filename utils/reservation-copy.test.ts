import type { SlotCredit } from '@/types/liquidity';
import { nextStepCopy } from './reservation-copy';

function credit(overrides: Partial<SlotCredit>): SlotCredit {
  return {
    id: 'c1', user_id: 'u1', estate_id: 'e1', property_tier: 4, intent_size: 1, target_occupancy: 4,
    status: 'booked_pending_claim', created_at: '2026-11-10T10:00:00.000Z', payment_deadline: '2026-11-14T10:00:00.000Z',
    amount_paid: 250000, listing_id: 'l1',
    ...overrides,
  };
}

describe('nextStepCopy', () => {
  it('asks for the exact amount and shows the hold when payment is due', () => {
    const copy = nextStepCopy(credit({}), 'awaiting_payment');
    expect(copy.title).toBe('Pay ₦250,000 to keep your spot');
    expect(copy.showHold).toBe(true);
    expect(copy.ctaLabel).toBe('Pay now');
  });
  it('does not promise anything the backend does not do while under review', () => {
    const copy = nextStepCopy(credit({}), 'under_review');
    expect(copy.showHold).toBe(false);
    expect(copy.body).not.toMatch(/window|starts/i);
  });
  it('sends solo and group bookings to different places once paid', () => {
    expect(nextStepCopy(credit({ target_occupancy: 1 }), 'paid').ctaLabel).toBe('View booking');
    expect(nextStepCopy(credit({ target_occupancy: 4 }), 'paid').ctaLabel).toBe('Open household');
  });
  it('lets an expired hold be reserved again', () => {
    expect(nextStepCopy(credit({}), 'expired').ctaLabel).toBe('Reserve again');
    expect(nextStepCopy(credit({ listing_id: undefined }), 'expired').ctaLabel).toBe('Find a place');
  });
});
