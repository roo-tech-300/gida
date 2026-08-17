import { resolveEstateForListing } from './liquidity-estate';
import { supabase } from '@/lib/supabase';
import type { DbListing } from '@/types/feed-listing';
import type { Estate } from '@/types/liquidity';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const supabaseMock = supabase as unknown as { from: jest.Mock };

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

const REAL_ESTATE_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const CREATED_ESTATE_ID = 'bbbbbbbb-1111-2222-3333-444444444444';

const ESTATE_ROW: Estate = {
  id: REAL_ESTATE_ID,
  name: 'Gida Prestige Flat',
  description: '4-bedroom student flat',
  campus: 'FUT Minna',
  property_tier: 4,
  price_per_annum: 1200000,
  physical_rooms_inventory: 1,
  abstract_slots_available: 4,
  rules: [],
  amenities: [],
};

const LISTING_ID = '11111111-2222-3333-4444-555555555555';

const LISTING: DbListing = {
  id: LISTING_ID,
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
  custom_features: ['Generator'],
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

function estatesChainWith(maybeSingleResults: unknown[]): Chain {
  const chain = makeChain();
  chain.maybeSingle = jest.fn(async () => maybeSingleResults.shift() ?? { data: null, error: { message: 'no more results' } });
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('resolveEstateForListing', () => {
  it('returns the real estate id when the listing has estate_id and the fetch succeeds', async () => {
    const chain = estatesChainWith([{ data: ESTATE_ROW, error: null }]);
    supabaseMock.from.mockReturnValue(chain);

    const result = await resolveEstateForListing({ ...LISTING, estate_id: REAL_ESTATE_ID });

    expect(result.estateId).toBe(REAL_ESTATE_ID);
    expect(result.estate).toEqual(ESTATE_ROW);
    expect(chain.insert).not.toHaveBeenCalled();
  });

  it('keeps the listing estate_id even when the estate fetch fails', async () => {
    const chain = estatesChainWith([{ data: null, error: { message: 'offline' } }]);
    supabaseMock.from.mockReturnValue(chain);

    const result = await resolveEstateForListing({ ...LISTING, estate_id: REAL_ESTATE_ID });

    expect(result.estateId).toBe(REAL_ESTATE_ID);
    expect(result.estate.id).toMatch(/^est-/);
    expect(chain.insert).not.toHaveBeenCalled();
  });

  it('reuses an existing estate when the listing has no estate_id', async () => {
    const chain = estatesChainWith([{ data: { id: CREATED_ESTATE_ID }, error: null }]);
    supabaseMock.from.mockReturnValue(chain);

    const result = await resolveEstateForListing(LISTING);

    expect(result.estateId).toBe(CREATED_ESTATE_ID);
    expect(chain.insert).not.toHaveBeenCalled();
  });

  it('creates a new estate from the listing when none exists', async () => {
    const chain = estatesChainWith([
      { data: null, error: null },
      { data: { ...ESTATE_ROW, id: CREATED_ESTATE_ID }, error: null },
    ]);
    supabaseMock.from.mockReturnValue(chain);

    const result = await resolveEstateForListing(LISTING);

    expect(chain.insert).toHaveBeenCalledTimes(1);
    expect(result.estateId).toBe(CREATED_ESTATE_ID);
  });

  it('falls back to a local estate id when estate creation fails', async () => {
    const chain = estatesChainWith([
      { data: null, error: null },
      { data: null, error: { message: 'RLS denied insert' } },
    ]);
    supabaseMock.from.mockReturnValue(chain);

    const result = await resolveEstateForListing(LISTING);

    expect(result.estateId).toBe(`est-${LISTING_ID.slice(0, 8)}`);
    expect(result.estate.id).toBe(result.estateId);
  });
});
