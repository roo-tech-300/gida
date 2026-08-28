import { purchaseSlotCredit, findUserCreditForProperty } from './liquidity-service';
import { supabase } from '@/lib/supabase';
import type { DbListing } from '@/types/feed-listing';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

const supabaseMock = supabase as unknown as {
  auth: { getUser: jest.Mock };
  from: jest.Mock;
  rpc: jest.Mock;
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

const TEST_USER = 'aaaaaaaa-1111-2222-3333-444444444444';
const CREDIT_ID = 'eeeeeeee-1111-2222-3333-444444444444';
const SECOND_CREDIT_ID = 'f0f0f0f0-1111-2222-3333-444444444444';
const POD_ID = 'dddddddd-1111-2222-3333-444444444444';
const ESTATE_ID = 'ffffffff-1111-2222-3333-444444444444';

const LISTING: DbListing = {
  id: '11111111-2222-3333-4444-555555555555',
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

function chainFor(tables: Partial<Record<string, Chain>>): jest.Mock {
  return jest.fn((table: string) => tables[table] ?? makeChain());
}

function successChain(data: unknown): Chain {
  const chain = makeChain();
  chain.maybeSingle = jest.fn(async () => ({ data, error: null }));
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  supabaseMock.from.mockImplementation(() => makeChain());
  supabaseMock.rpc.mockResolvedValue({ error: null });
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: TEST_USER } } });
});

describe('purchaseSlotCredit dedupe (one spot per user per listing)', () => {
  it('rejects a second purchase for the same listing', async () => {
    const slotCreditsChain = makeChain();
    const results = [
      { data: null, error: null },
      { data: { id: CREDIT_ID }, error: null },
      { data: { id: CREDIT_ID, user_id: TEST_USER, listing_id: LISTING.id, status: 'booked_pending_claim' }, error: null },
    ];
    slotCreditsChain.maybeSingle = jest.fn(async () => results.shift() ?? { data: null, error: { message: 'no more results' } });

    supabaseMock.from.mockImplementation(
      chainFor({
        estates: successChain({ id: ESTATE_ID }),
        pods: successChain({ id: POD_ID }),
        slot_credits: slotCreditsChain,
      }),
    );

    await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });

    await expect(
      purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 }),
    ).rejects.toThrow('already have a spot reserved');
  });

  it('allows a purchase for a different listing', async () => {
    const slotCreditsChain = makeChain();
    const results = [
      { data: null, error: null },
      { data: { id: CREDIT_ID }, error: null },
      { data: null, error: null },
      { data: { id: SECOND_CREDIT_ID }, error: null },
    ];
    slotCreditsChain.maybeSingle = jest.fn(async () => results.shift() ?? { data: null, error: { message: 'no more results' } });

    supabaseMock.from.mockImplementation(
      chainFor({
        estates: successChain({ id: ESTATE_ID }),
        pods: successChain({ id: POD_ID }),
        slot_credits: slotCreditsChain,
      }),
    );

    const other = { ...LISTING, id: '22222222-3333-4444-5555-666666666666' };
    const { credit } = await purchaseSlotCredit({ listing: other, targetOccupancy: 2 });
    expect(credit.listing_id).toBe(other.id);
  });

  it('rejects joining a pod when the user already holds that listing', async () => {
    supabaseMock.from.mockImplementation(
      chainFor({
        slot_credits: successChain({ id: CREDIT_ID, user_id: TEST_USER, listing_id: LISTING.id, status: 'booked_pending_claim' }),
      }),
    );

    await expect(
      purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2, joinCode: 'GIDA-POD-SOMECODE12' }),
    ).rejects.toThrow('already have a spot reserved');
  });

  it('surfaces the server credit through findUserCreditForProperty', async () => {
    supabaseMock.from.mockImplementation(
      chainFor({ slot_credits: successChain({ id: CREDIT_ID, user_id: TEST_USER, listing_id: LISTING.id }) }),
    );

    const credit = await findUserCreditForProperty(TEST_USER, LISTING.id);
    expect(credit?.id).toBe(CREDIT_ID);
  });
});
