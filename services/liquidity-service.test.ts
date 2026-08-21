import { purchaseSlotCredit, findPodByGroupCode, inviteRoommateToPod, findUserCreditForProperty } from './liquidity-service';
import { acceptLodgeInvitation, fetchMyPendingInvitations, respondToLodgeInvitation } from './lodge-invitation-service';
import { supabase } from '@/lib/supabase';
import type { DbListing } from '@/types/feed-listing';
import type { Pod, PendingLodgeInvitation } from '@/types/liquidity';

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
  chain.order = jest.fn(() => chain);
  chain.single = jest.fn(async () => ({ data: null, error: { message: 'offline' } }));
  chain.maybeSingle = jest.fn(async () => ({ data: null, error: { message: 'offline' } }));
  chain.insert = jest.fn(() => chain);
  chain.update = jest.fn(() => chain);
  chain.delete = jest.fn(() => chain);
  return chain;
}

function rowsChain(rows: unknown[]): Chain {
  const chain = makeChain();
  (chain as unknown as { then: (resolve: (value: unknown) => void) => void }).then = (resolve) => resolve({ data: rows, error: null });
  return chain;
}

const TEST_USER = 'aaaaaaaa-1111-2222-3333-444444444444';
const FRIEND_ID = 'bbbbbbbb-1111-2222-3333-444444444444';
const FOUNDER_ID = 'cccccccc-1111-2222-3333-444444444444';
const POD_ID = 'dddddddd-1111-2222-3333-444444444444';
const CREDIT_ID = 'eeeeeeee-1111-2222-3333-444444444444';
const ESTATE_ID = 'ffffffff-1111-2222-3333-444444444444';
const GROUP_CODE = 'GIDA-POD-TESTCODE12';

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

type MaybeResult = { data: unknown; error: unknown };

function sequentialChain(results: MaybeResult[]): Chain {
  const chain = makeChain();
  chain.maybeSingle = jest.fn(async () => results.shift() ?? { data: null, error: { message: 'no more results' } });
  return chain;
}

function founderPodFixture(): Pod {
  return {
    id: POD_ID,
    estate_id: ESTATE_ID,
    listing_id: LISTING.id,
    property_tier: 4,
    matched_gender: 'ANY',
    target_occupancy: 2,
    group_code: GROUP_CODE,
    members: [{
      user_id: FOUNDER_ID,
      full_name: 'Founder',
      intent_size: 1,
      campus: '',
      major: '',
      cleanliness_score: 5,
      sleep_schedule: '',
      slot_credit_id: 'founder-credit-id',
      amount_paid: 610000,
    }],
    current_total_intent: 1,
    is_finalized: false,
    physical_room_id: null,
    created_at: new Date().toISOString(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  supabaseMock.from.mockImplementation(() => makeChain());
  supabaseMock.rpc.mockResolvedValue({ error: null });
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: TEST_USER } } });
});

describe('reserve flow (server-backed)', () => {
  it('rejects reserving when the user is signed out', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });

    await expect(purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 })).rejects.toThrow(/sign in/i);
  });

  it('creates a founder reservation end-to-end and records invited friends', async () => {
    const invitationInserts: unknown[] = [];
    const invitationsChain = makeChain();
    invitationsChain.insert = jest.fn((payload: unknown) => {
      invitationInserts.push(payload);
      return invitationsChain;
    });

    supabaseMock.from.mockImplementation(
      chainFor({
        estates: successChain({ id: ESTATE_ID }),
        slot_credits: sequentialChain([
          { data: null, error: null },
          { data: { id: CREDIT_ID }, error: null },
        ]),
        pods: successChain({ id: POD_ID }),
        pod_invitations: invitationsChain,
      }),
    );

    const { credit, synced } = await purchaseSlotCredit({
      listing: LISTING,
      targetOccupancy: 2,
      invitedFriends: [{ id: FRIEND_ID, name: 'Ada' }],
    });

    expect(synced).toBe(true);
    expect(credit.id).toBe(CREDIT_ID);
    expect(invitationInserts[0]).toEqual([
      expect.objectContaining({ pod_id: POD_ID, inviter_user_id: TEST_USER, invitee_user_id: FRIEND_ID, invitee_name: 'Ada' }),
    ]);
  });

  it('throws when the server cannot persist the reservation', async () => {
    await expect(purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 })).rejects.toThrow(
      /Could not persist your reservation/,
    );
  });

  it('blocks a second reservation for the same listing', async () => {
    supabaseMock.from.mockImplementation(
      chainFor({
        slot_credits: successChain({ id: CREDIT_ID, user_id: TEST_USER, listing_id: LISTING.id, status: 'booked_pending_claim' }),
      }),
    );

    await expect(purchaseSlotCredit({ listing: LISTING, targetOccupancy: 2 })).rejects.toThrow(
      'You already have a spot reserved on this property.',
    );
  });
});

describe('pods and invites', () => {
  it('finds a pod by group code from the server', async () => {
    const pod = founderPodFixture();
    supabaseMock.from.mockImplementation(chainFor({ pods: successChain(pod) }));

    const found = await findPodByGroupCode(GROUP_CODE.toLowerCase());
    expect(found?.id).toBe(POD_ID);
    expect(found?.group_code).toBe(GROUP_CODE);
  });

  it('inviteRoommateToPod inserts a pending invitation row', async () => {
    const inserts: unknown[] = [];
    const invitationsChain = makeChain();
    invitationsChain.insert = jest.fn((payload: unknown) => {
      inserts.push(payload);
      return invitationsChain;
    });
    supabaseMock.from.mockImplementation(chainFor({ pod_invitations: invitationsChain }));

    await inviteRoommateToPod(POD_ID, 'Tunde', FRIEND_ID);

    expect(inserts[0]).toMatchObject({
      pod_id: POD_ID,
      inviter_user_id: TEST_USER,
      invitee_user_id: FRIEND_ID,
      invitee_name: 'Tunde',
    });
  });

  it('inviteRoommateToPod requires a pod id', async () => {
    await expect(inviteRoommateToPod(undefined, 'Tunde')).rejects.toThrow('No pod found to invite to.');
  });
});

describe('lodge invitations', () => {
  const invitationRow = {
    id: 'inv-1',
    pod_id: POD_ID,
    inviter_user_id: FOUNDER_ID,
    invitee_user_id: TEST_USER,
    invitee_name: 'Me',
    status: 'pending',
    created_at: new Date().toISOString(),
    pod: {
      id: POD_ID,
      group_code: GROUP_CODE,
      listing_id: LISTING.id,
      property_tier: 4,
      target_occupancy: 2,
      current_total_intent: 1,
    },
  };

  function invitationFixture(): PendingLodgeInvitation {
    const { pod, ...rest } = invitationRow;
    return { ...(rest as Omit<PendingLodgeInvitation, 'pod'>), pod };
  }

  it('lists pending invitations for the signed-in invitee', async () => {
    supabaseMock.from.mockImplementation(chainFor({ pod_invitations: rowsChain([invitationRow]) }));

    const invitations = await fetchMyPendingInvitations();
    expect(invitations).toHaveLength(1);
    expect(invitations[0].pod.group_code).toBe(GROUP_CODE);
    expect(invitations[0].pod.target_occupancy).toBe(2);
  });

  it('returns no invitations when signed out', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });

    expect(await fetchMyPendingInvitations()).toHaveLength(0);
  });

  it('declining flips the invitation status scoped to the invitee', async () => {
    const updates: unknown[] = [];
    const invitationsChain = rowsChain([]);
    invitationsChain.update = jest.fn((payload: unknown) => {
      updates.push(payload);
      return invitationsChain;
    });
    supabaseMock.from.mockImplementation(chainFor({ pod_invitations: invitationsChain }));

    await respondToLodgeInvitation('inv-1', 'declined');

    expect(updates[0]).toEqual({ status: 'declined' });
  });

  it('accepting creates a slot credit, joins the pod, and marks the invitation accepted', async () => {
    const updates: unknown[] = [];
    const invitationsChain = rowsChain([]);
    invitationsChain.update = jest.fn((payload: unknown) => {
      updates.push(payload);
      return invitationsChain;
    });

    supabaseMock.from.mockImplementation(
      chainFor({
        pods: successChain(founderPodFixture()),
        estates: successChain({ id: ESTATE_ID }),
        slot_credits: successChain({ id: CREDIT_ID }),
        pod_invitations: invitationsChain,
      }),
    );

    const { credit } = await acceptLodgeInvitation(invitationFixture(), LISTING);

    expect(credit.status).toBe('booked_pending_claim');
    expect(credit.id).toBe(CREDIT_ID);
    expect(updates[0]).toEqual({ status: 'accepted' });
  });

  it('rejects accepting when the group already filled up', async () => {
    const pod = founderPodFixture();
    pod.current_total_intent = 2;
    supabaseMock.from.mockImplementation(chainFor({ pods: successChain(pod) }));

    await expect(acceptLodgeInvitation(invitationFixture(), LISTING)).rejects.toThrow('already full');
  });

  it('rejects accepting when signed out', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });

    await expect(acceptLodgeInvitation(invitationFixture(), LISTING)).rejects.toThrow(/sign in/i);
  });
});

describe('credit lookups', () => {
  it('finds a user credit for a property from the server', async () => {
    supabaseMock.from.mockImplementation(
      chainFor({ slot_credits: successChain({ id: CREDIT_ID, user_id: TEST_USER, listing_id: LISTING.id }) }),
    );

    const credit = await findUserCreditForProperty(TEST_USER, LISTING.id);
    expect(credit?.id).toBe(CREDIT_ID);
  });

  it('returns null lookups when signed out without touching the server', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });

    expect(await findUserCreditForProperty(null, LISTING.id)).toBeNull();
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });
});
