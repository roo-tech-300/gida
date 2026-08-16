import { fetchUnlockedListingIds, initializeLocationPayment, unlockLocationForLodge, verifyLocationPayment } from './location-access-service';
import { supabase } from '@/lib/supabase';

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

const WORKER_URL = 'https://gida-worker.test';

type Chain = Record<string, jest.Mock>;

function makeChain(data?: unknown, error?: unknown): Chain {
  const chain: Chain = {};
  chain.select = jest.fn(() => chain);
  chain.eq = jest.fn(async () => ({ data, error: error ?? null }));
  return chain;
}

function mockFetchOk(body: unknown) {
  (global as unknown as { fetch: jest.Mock }).fetch.mockResolvedValue({
    ok: true,
    json: async () => body,
  });
}

function mockFetchError() {
  (global as unknown as { fetch: jest.Mock }).fetch.mockResolvedValue({
    ok: false,
    json: async () => ({ error: 'boom' }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.EXPO_PUBLIC_WORKER_URL;
  (global as unknown as { fetch: jest.Mock }).fetch = jest.fn();
  supabaseMock.from.mockImplementation(() => makeChain(null));
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });
});

describe('location access payments', () => {
  it('returns no unlocked listings for the offline DEV user', async () => {
    const ids = await fetchUnlockedListingIds();

    expect(ids).toEqual([]);
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it('returns unlocked listing ids for a signed-in user', async () => {
    process.env.EXPO_PUBLIC_WORKER_URL = WORKER_URL;
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: { id: 'usr-signed-in', email: 'student@example.com' } },
    });
    supabaseMock.from.mockImplementation(() => makeChain([{ listing_id: 'id-a' }, { listing_id: 'id-b' }]));

    const ids = await fetchUnlockedListingIds();

    expect(ids).toEqual(['id-a', 'id-b']);
    expect(supabaseMock.from).toHaveBeenCalledWith('location_access_payments');
  });

  it('returns an empty list when the unlock query fails', async () => {
    process.env.EXPO_PUBLIC_WORKER_URL = WORKER_URL;
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: { id: 'usr-signed-in', email: 'student@example.com' } },
    });
    supabaseMock.from.mockImplementation(() => makeChain(null, { message: 'offline' }));

    const ids = await fetchUnlockedListingIds();

    expect(ids).toEqual([]);
  });

  it('simulates payment for the offline DEV user', async () => {
    const result = await initializeLocationPayment('id-a');

    expect(result.simulated).toBe(true);
    expect((global as unknown as { fetch: jest.Mock }).fetch).not.toHaveBeenCalled();
  });

  it('initializes a Paystack session through the worker for signed-in users', async () => {
    process.env.EXPO_PUBLIC_WORKER_URL = WORKER_URL;
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: { id: 'usr-signed-in', email: 'student@example.com' } },
    });
    mockFetchOk({ authorizationUrl: 'https://checkout.paystack.com/xyz', reference: 'GIDA-LOC-1' });

    const result = await initializeLocationPayment('id-a');

    expect(result.simulated).toBe(false);
    expect(result.authorizationUrl).toBe('https://checkout.paystack.com/xyz');
    expect(result.reference).toBe('GIDA-LOC-1');
    expect((global as unknown as { fetch: jest.Mock }).fetch).toHaveBeenCalledWith(
      `${WORKER_URL}/api/paystack/initialize`,
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"listingId":"id-a"'),
      }),
    );
  });

  it('throws when the signed-in user has no email', async () => {
    process.env.EXPO_PUBLIC_WORKER_URL = WORKER_URL;
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: 'usr-signed-in' } } });

    await expect(initializeLocationPayment('id-a')).rejects.toThrow(/signed in/i);
  });

  it('reports a verified payment as unlocked', async () => {
    process.env.EXPO_PUBLIC_WORKER_URL = WORKER_URL;
    mockFetchOk({ unlocked: true });

    const result = await verifyLocationPayment('GIDA-LOC-1');

    expect(result.unlocked).toBe(true);
    expect(result.kind).toBe('location');
    expect((global as unknown as { fetch: jest.Mock }).fetch).toHaveBeenCalledWith(
      `${WORKER_URL}/api/paystack/verify`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('surfaces a tour payment kind from verify', async () => {
    process.env.EXPO_PUBLIC_WORKER_URL = WORKER_URL;
    mockFetchOk({ unlocked: true, kind: 'tour', bookingId: 'booking-1' });

    const result = await verifyLocationPayment('GIDA-LOC-1');

    expect(result.kind).toBe('tour');
    expect(result.bookingId).toBe('booking-1');
  });

  it('reports a failed payment as still locked', async () => {
    process.env.EXPO_PUBLIC_WORKER_URL = WORKER_URL;
    mockFetchOk({ unlocked: false });

    await expect(verifyLocationPayment('GIDA-LOC-1')).resolves.toEqual({ unlocked: false, kind: 'location' });
  });

  it('returns false when the worker is unreachable', async () => {
    process.env.EXPO_PUBLIC_WORKER_URL = WORKER_URL;
    mockFetchError();

    await expect(verifyLocationPayment('GIDA-LOC-1')).resolves.toEqual({ unlocked: false, kind: 'location' });
  });

  it('short-circuits to false without a worker url', async () => {
    await expect(verifyLocationPayment('GIDA-LOC-1')).resolves.toEqual({ unlocked: false, kind: 'location' });
  });

  it('records a lodge unlock for a signed-in user with a paid slot credit', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: { id: 'usr-signed-in', email: 'student@example.com' } },
    });
    supabaseMock.from.mockImplementation(() => ({
      insert: jest.fn(async () => ({ error: null })),
    }));

    const ok = await unlockLocationForLodge({ creditId: 'credit-1', listingId: 'id-a' });

    expect(ok).toBe(true);
    expect(supabaseMock.from).toHaveBeenCalledWith('location_access_payments');
  });

  it('skips the lodge unlock insert for the offline DEV user', async () => {
    const ok = await unlockLocationForLodge({ creditId: 'credit-1', listingId: 'id-a' });

    expect(ok).toBe(true);
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });
});
