import type { Env } from './env';
import { receiptBody } from './payment-receipt';
import { confirmSlotPayment } from './slot-confirm';

const env: Env = { SUPABASE_URL: 'http://db.local', SUPABASE_SERVICE_ROLE_KEY: 'k', PAYSTACK_SECRET_KEY: 's' };
const STUDENT = 'b0000000-0000-0000-0000-000000000001';
const SUPPORT = 'a0000000-0000-0000-0000-000000000002';

type Call = { url: string; method: string; body?: string };
let calls: Call[] = [];

/** `changedRows` is what the guarded PATCH returns: [] means the credit was already paid. */
function mockDb(changedRows: unknown[]) {
  calls = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    calls.push({ url, method, body: typeof init?.body === 'string' ? init.body : undefined });
    if (url.includes('/slot_credits?id=eq.') && method === 'PATCH') return new Response(JSON.stringify(changedRows), { status: 200 });
    if (url.includes('/slot_credits?id=eq.')) return new Response(JSON.stringify([{ user_id: STUDENT, listing_id: 'l1' }]), { status: 200 });
    if (url.includes('/location_access_payments')) return new Response(null, { status: 201 });
    if (url.includes('/rpc/get_support_admin_id')) return new Response(JSON.stringify(SUPPORT), { status: 200 });
    if (url.includes('/conversations') && method === 'GET') return new Response(JSON.stringify([{ id: 'conv-1' }]), { status: 200 });
    if (url.includes('/listings')) return new Response(JSON.stringify([{ title: 'Royal Lodge, 2-bed' }]), { status: 200 });
    if (url.endsWith('/messages') && method === 'POST') return new Response(null, { status: 201 });
    return new Response('unexpected', { status: 500 });
  }) as unknown as typeof fetch;
}

const receiptPosts = () => calls.filter((call) => call.url.endsWith('/messages') && call.method === 'POST');

describe('confirmSlotPayment receipts', () => {
  it('only moves unpaid reservations to paid', async () => {
    mockDb([{ user_id: STUDENT }]);
    await confirmSlotPayment(env, 'c1', 'ref');
    const patch = calls.find((call) => call.method === 'PATCH');
    expect(patch?.url).toContain('status=in.(booked,booked_pending_claim,expired)');
  });

  it('sends one receipt from the support admin on the first confirmation', async () => {
    mockDb([{ user_id: STUDENT }]);
    const result = await confirmSlotPayment(env, 'c1', 'ref', { paidBy: 'parent', amountKobo: 25_000_000 });
    expect(result.confirmed).toBe(true);
    const [post] = receiptPosts();
    const body = JSON.parse(post.body ?? '{}');
    expect(receiptPosts()).toHaveLength(1);
    expect(body.sender_id).toBe(SUPPORT);
    expect(body.conversation_id).toBe('conv-1');
    expect(body.body).toContain('your parent just paid');
    expect(body.body).toContain('Royal Lodge');
  });

  it('sends nothing when the reservation was already paid (webhook and verify both fire)', async () => {
    mockDb([]);
    const result = await confirmSlotPayment(env, 'c1', 'ref', { paidBy: 'parent' });
    expect(result.confirmed).toBe(true);
    expect(receiptPosts()).toHaveLength(0);
  });

  it('still confirms the payment when the receipt cannot be sent', async () => {
    mockDb([{ user_id: STUDENT }]);
    const original = global.fetch;
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes('/rpc/get_support_admin_id')) throw new Error('network down');
      return original(input, init);
    }) as unknown as typeof fetch;
    const result = await confirmSlotPayment(env, 'c1', 'ref');
    expect(result).toEqual({ confirmed: true, locationUnlocked: true });
  });
});

describe('receiptBody', () => {
  it('words parent and student receipts differently', () => {
    expect(receiptBody({ placeTitle: 'Royal Lodge, 2-bed', amountKobo: 25_000_000, paidBy: 'parent' }))
      .toBe('Good news: your parent just paid ₦250,000 for Royal Lodge. Your spot is secured.');
    expect(receiptBody({ placeTitle: null, paidBy: 'student' })).toBe('Payment received for your place. Your spot is secured.');
  });
});
