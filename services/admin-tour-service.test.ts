import { fetchAdminTourDetail, fetchAdminTours } from './admin-tour-service';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const supabaseMock = supabase as unknown as { from: jest.Mock };

type Chain = Record<string, jest.Mock>;

function listChain(data: unknown): Chain {
  const chain: Chain = {};
  chain.select = jest.fn(() => chain);
  chain.order = jest.fn(() => chain);
  chain.limit = jest.fn(async () => ({ data, error: null }));
  return chain;
}

function inChain(data: unknown): Chain {
  const chain: Chain = {};
  chain.select = jest.fn(() => chain);
  chain.in = jest.fn(async () => ({ data, error: null }));
  return chain;
}

function singleChain(data: unknown): Chain {
  const chain: Chain = {};
  chain.select = jest.fn(() => chain);
  chain.eq = jest.fn(() => chain);
  chain.maybeSingle = jest.fn(async () => ({ data, error: null }));
  return chain;
}

const bookingRow = {
  id: 'b1',
  user_id: 'u1',
  listing_id: 'l1',
  scheduled_date: '2026-08-20',
  scheduled_time: '10:00 AM',
  status: 'booked',
  created_at: '2026-08-18T09:00:00Z',
};

const listingRow = {
  id: 'l1',
  title: 'Pearl House',
  location_landmark: 'Gidan Zaki',
  city: 'Zaria',
  primary_image: null,
  price_amount: 250000,
};

beforeEach(() => {
  jest.clearAllMocks();
  supabaseMock.from.mockImplementation(() => listChain([]));
});

describe('admin tour service', () => {
  it('merges student names and listing metadata into tour rows', async () => {
    supabaseMock.from
      .mockImplementationOnce(() => listChain([bookingRow]))
      .mockImplementationOnce(() => inChain([{ id: 'u1', full_name: 'Ada Obi' }]))
      .mockImplementationOnce(() => inChain([listingRow]));

    const tours = await fetchAdminTours();

    expect(tours).toHaveLength(1);
    expect(tours[0]).toMatchObject({
      id: 'b1',
      listing_id: 'l1',
      student_name: 'Ada Obi',
      status: 'booked',
      listings: {
        title: 'Pearl House',
        location_landmark: 'Gidan Zaki',
        city: 'Zaria',
        primary_image: null,
        price_amount: 250000,
      },
    });
    expect(supabaseMock.from).toHaveBeenNthCalledWith(1, 'tour_bookings');
    expect(supabaseMock.from).toHaveBeenNthCalledWith(2, 'profiles');
    expect(supabaseMock.from).toHaveBeenNthCalledWith(3, 'listings');
  });

  it('returns an empty list when the tour fetch fails', async () => {
    const chain: Chain = {};
    chain.select = jest.fn(() => chain);
    chain.order = jest.fn(() => chain);
    chain.limit = jest.fn(async () => ({ data: null, error: { message: 'offline' } }));

    supabaseMock.from.mockImplementation(() => chain);

    await expect(fetchAdminTours()).resolves.toEqual([]);
  });

  it('falls back to a null listing when metadata is missing', async () => {
    supabaseMock.from
      .mockImplementationOnce(() => listChain([bookingRow]))
      .mockImplementationOnce(() => inChain([]))
      .mockImplementationOnce(() => inChain([]));

    const tours = await fetchAdminTours();

    expect(tours[0].listings).toBeNull();
  });

  it('fetches a single tour detail with student and listing', async () => {
    supabaseMock.from
      .mockImplementationOnce(() => singleChain(bookingRow))
      .mockImplementationOnce(() => inChain([{ id: 'u1', full_name: 'Ada Obi' }]))
      .mockImplementationOnce(() => inChain([listingRow]));

    const detail = await fetchAdminTourDetail('b1');

    expect(detail).toMatchObject({
      booking: { id: 'b1', status: 'booked', scheduled_date: '2026-08-20', scheduled_time: '10:00 AM' },
      student: { id: 'u1', name: 'Ada Obi' },
      listing: { title: 'Pearl House', city: 'Zaria', price_amount: 250000 },
    });
  });

  it('returns null when the booking is not found', async () => {
    supabaseMock.from.mockImplementation(() => singleChain(null));

    await expect(fetchAdminTourDetail('missing')).resolves.toBeNull();
  });
});
