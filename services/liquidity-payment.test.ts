import { purchaseSlotCredit } from './liquidity-service';
import { markSlotCreditPaid, expireSlotCredit } from './liquidity-payment-service';
import { getLocalCredits, getLocalPods, resetLocalLiquidityState } from './liquidity-store';
import { supabase } from '@/lib/supabase';
import type { DbListing } from '@/types/feed-listing';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));

const supabaseMock = supabase as unknown as {
  auth: { getUser: jest.Mock };
  from: jest.Mock;
};

type Chain = Record<string, jest.Mock>;

function makeChain(): Chain {
  const chain: Chain = {};
  chain.select = jest.fn(() => chain);
  chain.eq = jest.fn(() => chain);
  chain.maybeSingle = jest.fn(async () => ({ data: null, error: { message: 'offline' } }));
  chain.insert = jest.fn(() => chain);
  chain.update = jest.fn(() => chain);
  return chain;
}

const LISTING: DbListing = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  title: 'Gida Prestige Flat',
  description: '4-bedroom student flat',
  price_amount: 1200000,
  location_landmark: 'Opposite Gate 2',
  city: 'Minna',
  category: 'flat',
  layout_type: 'flat',
  number_of_bedrooms: 4,
  number_of_bathrooms: 4,
  size_sqft: 1200,
  total_floors: 2,
  primary_image: null,
  status: 'available',
  featured: false,
  custom_features: ['Generator', 'Internet'],
  is_shared_bathroom: false,
  is_shared_kitchen: false,
  has_borehole: true,
  has_generator: true,
  has_fenced_gate: true,
  has_internet: true,
  has_burglary: true,
  has_cabinet: true,
  has_wardrobe: true,
  landlord_id: null,
  admin_id: '99999999-8888-7777-6666-555555555555',
  lease_term: 'per_annum',
  units_available: 1,
  latitude: 9.6145,
  longitude: 6.5463,
  campus: 'Federal University of Technology, Minna',
  rules: ['Quiet hours after 10 PM'],
  max_roommates: 4,
  property_tier: 4,
  abstract_slots_available: 4,
};

beforeEach(() => {
  jest.clearAllMocks();
  resetLocalLiquidityState();
  supabaseMock.from.mockImplementation(() => makeChain());
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });
});

describe('slot credit payment lifecycle', () => {
  it('marks a pending credit as paid and records paid_at', async () => {
    const { credit } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });
    expect(credit.status).toBe('booked_pending_claim');

    const paid = await markSlotCreditPaid(credit.id);
    expect(paid?.status).toBe('paid_unmatched');
    expect(paid?.paid_at).toBeTruthy();
    expect(getLocalCredits().find((c) => c.id === credit.id)?.status).toBe('paid_unmatched');
  });

  it('is idempotent — a second mark keeps the original paid_at', async () => {
    const { credit } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });
    const first = await markSlotCreditPaid(credit.id);

    const second = await markSlotCreditPaid(credit.id);
    expect(second?.paid_at).toBe(first?.paid_at);
  });

  it('expires a pending credit while preserving amount_paid', async () => {
    const { credit } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });
    const ok = await expireSlotCredit(credit.id);

    expect(ok).toBe(true);
    expect(getLocalCredits().find((c) => c.id === credit.id)?.status).toBe('expired');
    expect(getLocalCredits().find((c) => c.id === credit.id)?.amount_paid).toBe(credit.amount_paid);
  });

  it('still expires a credit that only exists on the server (not in local store)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: 'usr-signed-in' } } });

    const ok = await expireSlotCredit('credit-remote-only');

    expect(ok).toBe(true);
    expect(supabaseMock.from).toHaveBeenCalledWith('slot_credits');
  });

  it('decrements pod occupancy and un-finalizes when a credit expires', async () => {
    const { credit } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });
    const podBefore = getLocalPods().find((p) => p.members.some((m) => m.slot_credit_id === credit.id));
    expect(podBefore?.current_total_intent).toBe(1);

    await expireSlotCredit(credit.id);

    const podAfter = getLocalPods().find((p) => p.members.some((m) => m.slot_credit_id === credit.id));
    expect(podAfter?.current_total_intent).toBe(0);
    expect(podAfter?.is_finalized).toBe(false);
  });

  it('allows a fresh purchase after the previous credit expired', async () => {
    const first = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });
    await expireSlotCredit(first.credit.id);

    const second = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });
    expect(second.credit.status).toBe('booked_pending_claim');
    expect(second.credit.id).not.toBe(first.credit.id);

    const matches = getLocalCredits().filter((c) => c.listing_id === LISTING.id);
    expect(matches).toHaveLength(2);
    expect(matches.map((c) => c.status).sort()).toEqual(['booked_pending_claim', 'expired']);
  });
});
