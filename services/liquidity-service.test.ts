import { purchaseSlotCredit, findPodByGroupCode, inviteRoommateToPod, resetLocalLiquidityState } from './liquidity-service';
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
  chain.single = jest.fn(async () => ({ data: null, error: { message: 'offline' } }));
  chain.maybeSingle = jest.fn(async () => ({ data: null, error: { message: 'offline' } }));
  chain.insert = jest.fn(() => chain);
  chain.update = jest.fn(() => chain);
  return chain;
}

const ESTATE_ID = 'cccccccc-1111-2222-3333-444444444444';
const POD_ID = 'dddddddd-1111-2222-3333-444444444444';
const CREDIT_ID = 'eeeeeeee-1111-2222-3333-444444444444';
const JOINER_ID = 'aaaaaaaa-1111-2222-3333-444444444444';

function signInAsJoiner() {
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: JOINER_ID } } });
  const creditsChain = makeChain();
  let call = 0;
  creditsChain.maybeSingle = jest.fn(async () => ({
    data: call++ % 2 === 0 ? null : { id: CREDIT_ID },
    error: null,
  }));
  supabaseMock.from.mockImplementation((table: string) => (table === 'slot_credits' ? creditsChain : makeChain()));
}

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

beforeEach(() => {
  jest.clearAllMocks();
  resetLocalLiquidityState();
  supabaseMock.from.mockImplementation(() => makeChain());
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });
});

describe('purchaseSlotCredit (founder + join-by-invite-code)', () => {
  it('creates a founder credit + pod with a shareable group code and target occupancy', async () => {
    const { credit } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });

    expect(credit.target_occupancy).toBe(2);
    expect(credit.invite_code).toMatch(/^GIDA-POD-\d{4}$/);
    expect(credit.estate_id).not.toBe(LISTING.id);

    const pod = await findPodByGroupCode(credit.invite_code as string);
    expect(pod).toBeDefined();
    expect(pod?.group_code).toBe(credit.invite_code);
    expect(pod?.current_total_intent).toBe(1);
    expect(pod?.is_finalized).toBe(false);
  });

  it('marks a solo occupancy (1/1) pod as finalized immediately', async () => {
    const { credit } = await purchaseSlotCredit({ listing: { ...LISTING, max_roommates: 1, property_tier: 1 }, targetOccupancy: 1 });
    const pod = await findPodByGroupCode(credit.invite_code as string);
    expect(pod?.is_finalized).toBe(true);
    expect(pod?.physical_room_id).toBeTruthy();
  });

  it('lets a joiner enter the invite code and join the same pod', async () => {
    const { credit: founder } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });
    signInAsJoiner();

    const { credit: joinerCredit } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2, joinCode: founder.invite_code as string });

    expect(joinerCredit.estate_id).toBe(founder.estate_id);
    const pod = await findPodByGroupCode(founder.invite_code as string);
    expect(pod?.members).toHaveLength(2);
    expect(pod?.current_total_intent).toBe(2);
    expect(pod?.is_finalized).toBe(true);
  });

  it('rejects a join when the pod is already at its target occupancy', async () => {
    const { credit: founder } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 1 });
    signInAsJoiner();

    await expect(
      purchaseSlotCredit({ listing: LISTING, targetOccupancy: 1, joinCode: founder.invite_code as string }),
    ).rejects.toThrow('already full');
  });

  it('rejects an unknown or invalid invite code', async () => {
    await expect(
      purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2, joinCode: 'GIDA-POD-9999' }),
    ).rejects.toThrow('Invite code not found');
  });

  it('rejects an out-of-range target occupancy', async () => {
    await expect(
      purchaseSlotCredit({ listing: LISTING, targetOccupancy: 9 }),
    ).rejects.toThrow('Invalid occupancy');
  });

  it('collects exactly rent + fee when a pod fills (no over/under-collection)', async () => {
    const { credit: founder } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 3 });
    signInAsJoiner();
    const j1 = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 3, joinCode: founder.invite_code as string });
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: 'bbbbbbbb-1111-2222-3333-444444444444' } } });
    const j2 = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 3, joinCode: founder.invite_code as string });

    const pod = await findPodByGroupCode(founder.invite_code as string);
    const collected = (pod?.members ?? []).reduce((sum, m) => sum + (m.amount_paid ?? 0), 0);

    expect(pod?.is_finalized).toBe(true);
    expect(collected).toBe(LISTING.price_amount + 20000);
    expect(founder.amount_paid).toBe(406667);
    expect(j1.credit.amount_paid).toBe(406667);
    expect(j2.credit.amount_paid).toBe(406666);
  });

  it('reports synced=false when the backend is unreachable', async () => {
    const { credit, synced } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });
    expect(credit.target_occupancy).toBe(2);
    expect(synced).toBe(false);
  });

  it('reports synced=true when estate, pod, and credit inserts all land', async () => {
    const estatesChain = makeChain();
    const estatesResults = [
      { data: null, error: null },
      { data: { id: ESTATE_ID, name: LISTING.title }, error: null },
    ];
    estatesChain.maybeSingle = jest.fn(async () => estatesResults.shift() ?? { data: null, error: { message: 'no more' } });
    const podsChain = makeChain();
    podsChain.maybeSingle = jest.fn(async () => ({ data: { id: POD_ID }, error: null }));
    const creditsChain = makeChain();
    creditsChain.maybeSingle = jest.fn(async () => ({ data: { id: CREDIT_ID }, error: null }));

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'estates') return estatesChain;
      if (table === 'pods') return podsChain;
      if (table === 'slot_credits') return creditsChain;
      return makeChain();
    });

    const { synced } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });
    expect(synced).toBe(true);
  });
});

describe('inviteRoommateToPod', () => {
  async function podIdFor(code: string): Promise<string> {
    const pod = await findPodByGroupCode(code);
    if (!pod) throw new Error('test pod not found');
    return pod.id;
  }

  it('invites into a partial pod without finalizing it', async () => {
    const { credit: founder } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 3 });
    const podId = await podIdFor(founder.invite_code as string);
    const pod = await inviteRoommateToPod(podId, 'friend@mail.com');

    expect(pod?.current_total_intent).toBe(2);
    expect(pod?.is_finalized).toBe(false);
    expect(pod?.members).toHaveLength(2);
  });

  it('finalizes the pod when the invite reaches the target occupancy', async () => {
    const { credit: founder } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });
    const podId = await podIdFor(founder.invite_code as string);
    const pod = await inviteRoommateToPod(podId, 'friend@mail.com');

    expect(pod?.current_total_intent).toBe(2);
    expect(pod?.is_finalized).toBe(true);
    expect(pod?.physical_room_id).toBeTruthy();
  });

  it('rejects an invite into a pod that is already at full occupancy', async () => {
    const { credit: founder } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 });
    signInAsJoiner();
    await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2, joinCode: founder.invite_code as string });
    const podId = await podIdFor(founder.invite_code as string);

    await expect(
      inviteRoommateToPod(podId, 'latecomer@mail.com'),
    ).rejects.toThrow('already at full occupancy');
  });

  it('targets the pod matching the given pod id', async () => {
    const { credit: founder } = await purchaseSlotCredit({ listing: LISTING, targetOccupancy: 4 });
    const { credit: other } = await purchaseSlotCredit({ listing: { ...LISTING, id: '22222222-3333-4444-5555-666666666666' }, targetOccupancy: 2 });
    const founderPodId = await podIdFor(founder.invite_code as string);
    const otherPodId = await podIdFor(other.invite_code as string);

    await inviteRoommateToPod(founderPodId, 'friend@mail.com');

    const founderPod = await findPodByGroupCode(founder.invite_code as string);
    const otherPod = await findPodByGroupCode(other.invite_code as string);
    expect(founderPod?.current_total_intent).toBe(2);
    expect(otherPod?.current_total_intent).toBe(1);
    expect(otherPodId).not.toBe(founderPodId);
  });
});
