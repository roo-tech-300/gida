import { purchaseSlotCredit } from './liquidity-service';
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
  chain.single = jest.fn(async () => ({ data: null, error: { message: 'offline' } }));
  chain.maybeSingle = jest.fn(async () => ({ data: null, error: { message: 'offline' } }));
  chain.insert = jest.fn(() => chain);
  chain.update = jest.fn(() => chain);
  return chain;
}

const TEST_USER = 'aaaaaaaa-1111-2222-3333-444444444444';
const JOINER_ID = 'bbbbbbbb-1111-2222-3333-444444444444';
const CREDIT_ID = 'eeeeeeee-1111-2222-3333-444444444444';
const JOINER_CREDIT_ID = 'f0f0f0f0-1111-2222-3333-444444444444';
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

function dedupeThenInsertChain(creditId: string): Chain {
  const chain = makeChain();
  const results = [
    { data: null, error: null },
    { data: { id: creditId }, error: null },
  ];
  chain.maybeSingle = jest.fn(async () => results.shift() ?? { data: null, error: { message: 'no more results' } });
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  supabaseMock.from.mockImplementation(() => makeChain());
  supabaseMock.rpc.mockResolvedValue({ error: null });
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: TEST_USER } } });
});

describe('server sync guarantees', () => {
  it('throws when the server inserts fail — no silent local fallback', async () => {
    await expect(purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 })).rejects.toThrow(
      /Could not persist your reservation/,
    );
  });

  it('persists amount_paid on the founder pod_members row', async () => {
    const memberInserts: unknown[] = [];
    const membersChain = makeChain();
    membersChain.insert = jest.fn((payload: unknown) => {
      memberInserts.push(payload);
      return membersChain;
    });

    supabaseMock.from.mockImplementation(
      chainFor({
        estates: successChain({ id: ESTATE_ID }),
        pods: successChain({ id: POD_ID }),
        slot_credits: dedupeThenInsertChain(CREDIT_ID),
        pod_members: membersChain,
      }),
    );

    const { synced } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });
    expect(synced).toBe(true);
    expect(memberInserts[0]).toMatchObject({ amount_paid: 600000 });
  });

  it('delegates a pod-finalizing join to the atomic join_pod RPC', async () => {
    supabaseMock.from.mockImplementation(
      chainFor({
        estates: successChain({ id: ESTATE_ID }),
        slot_credits: dedupeThenInsertChain(CREDIT_ID),
        pods: successChain({ id: POD_ID }),
      }),
    );

    const founder = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });

    supabaseMock.from.mockImplementation(
      chainFor({
        estates: successChain({ id: ESTATE_ID }),
        pods: successChain({
          id: POD_ID,
          estate_id: ESTATE_ID,
          listing_id: LISTING.id,
          property_tier: 4,
          matched_gender: 'ANY',
          target_occupancy: 2,
          group_code: founder.credit.invite_code,
          members: [{
            user_id: TEST_USER,
            full_name: 'Founder',
            intent_size: 1,
            campus: '',
            major: '',
            cleanliness_score: 5,
            sleep_schedule: '',
            slot_credit_id: CREDIT_ID,
            amount_paid: 600000,
          }],
          current_total_intent: 1,
          is_finalized: false,
          physical_room_id: null,
          created_at: new Date().toISOString(),
          verification_status: 'pending_verification',
        }),
      }),
    );
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: JOINER_ID } } });
    supabaseMock.rpc.mockResolvedValue({
      data: { creditId: JOINER_CREDIT_ID, podId: POD_ID, amountPaid: 600000, isFinalized: true },
      error: null,
    });

    const { credit, synced } = await purchaseSlotCredit({
      listing: LISTING,
      targetOccupancy: 2,
      joinCode: founder.credit.invite_code as string,
    });

    expect(synced).toBe(true);
    expect(credit.id).toBe(JOINER_CREDIT_ID);
    expect(credit.amount_paid).toBe(600000);
    expect(supabaseMock.rpc).toHaveBeenCalledWith('join_pod', {
      p_group_code: founder.credit.invite_code,
    });
  });
});
