import { markSlotCreditPaid, expireSlotCredit } from './liquidity-payment-service';
import { supabase } from '@/lib/supabase';

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
const LISTING_ID = '11111111-2222-3333-4444-555555555555';

function paidCreditRow() {
  return {
    id: CREDIT_ID,
    user_id: TEST_USER,
    listing_id: LISTING_ID,
    status: 'paid_unmatched',
    paid_at: new Date().toISOString(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  supabaseMock.from.mockImplementation(() => makeChain());
  supabaseMock.rpc.mockResolvedValue({ error: null });
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: TEST_USER } } });
});

describe('slot credit payment lifecycle (server-backed)', () => {
  it('marks a credit paid on the server and records the lodge unlock', async () => {
    const unlockInserts: unknown[] = [];
    const unlockChain = makeChain();
    unlockChain.insert = jest.fn((payload: unknown) => {
      unlockInserts.push(payload);
      return unlockChain;
    });

    supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'slot_credits') {
          const chain = makeChain();
          chain.update = jest.fn(() => chain);
          chain.maybeSingle = jest.fn(async () => ({ data: paidCreditRow(), error: null }));
          return chain;
        }
        return unlockChain;
      });

    const paid = await markSlotCreditPaid(CREDIT_ID);

    expect(paid?.status).toBe('paid_unmatched');
    expect(paid?.paid_at).toBeTruthy();
    expect(unlockInserts[0]).toMatchObject({
      user_id: TEST_USER,
      listing_id: LISTING_ID,
      method: 'lodge',
      reference: `GIDA-LODGE-${CREDIT_ID}`,
    });
  });

  it('returns null when the remote update fails', async () => {
    const ok = await markSlotCreditPaid(CREDIT_ID);
    expect(ok).toBeNull();
  });

  it('requires sign-in to mark payment', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });

    await expect(markSlotCreditPaid(CREDIT_ID)).rejects.toThrow(/sign in/i);
  });

  it('expires a credit remotely and reconciles the pod occupancy', async () => {
    const row = { ...paidCreditRow(), status: 'expired', paid_at: null };
    supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'slot_credits') {
          const chain = makeChain();
          chain.update = jest.fn(() => chain);
          chain.maybeSingle = jest.fn(async () => ({ data: row, error: null }));
          return chain;
        }
        return makeChain();
      });

    const ok = await expireSlotCredit(CREDIT_ID);

    expect(ok).toBe(true);
    expect(supabaseMock.rpc).toHaveBeenCalledWith('reconcile_pod_after_credit_expiry', { p_slot_credit_id: CREDIT_ID });
  });

  it('reports failure when the remote expiry update fails', async () => {
    const ok = await expireSlotCredit(CREDIT_ID);
    expect(ok).toBe(false);
    expect(supabaseMock.rpc).toHaveBeenCalled();
  });

  it('requires sign-in to expire a credit', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });

    await expect(expireSlotCredit(CREDIT_ID)).rejects.toThrow(/sign in/i);
  });
});

