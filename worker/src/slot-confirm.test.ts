import type { Env } from './env';
import { receiptBody } from './payment-receipt';
import { confirmSlotPayment } from './slot-confirm';

const env: Env = { SUPABASE_URL: 'http://db.local', SUPABASE_SERVICE_ROLE_KEY: 'k', PAYSTACK_SECRET_KEY: 's', PAYSTACK_BASE_URL: 'http://paystack.local' };
const STUDENT = 'b0000000-0000-0000-0000-000000000001';
const SUPPORT = 'a0000000-0000-0000-0000-000000000002';

type Call = { url: string; method: string; body?: string };
let calls: Call[] = [];

type Db = {
  /** What confirm_slot_payment answers: how the database says this payment should be treated. */
  decision: 'paid' | 'already_paid' | 'refund';
  /** Status already recorded for this reference (a payment already refunded). */
  attemptStatus?: string;
  /** Whether Paystack accepts the refund request. */
  refundOk?: boolean;
};

function mockDb({ decision, attemptStatus, refundOk = true }: Db) {
  calls = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    calls.push({ url, method, body: typeof init?.body === 'string' ? init.body : undefined });
    if (url.includes('/rpc/confirm_slot_payment')) return new Response(JSON.stringify(decision), { status: 200 });
    if (url.includes('/payment_attempts') && method === 'GET') return new Response(JSON.stringify(attemptStatus ? [{ status: attemptStatus }] : []), { status: 200 });
    if (url.includes('/payment_attempts') && method === 'PATCH') return new Response(null, { status: 204 });
    if (url.includes('/refund')) return refundOk ? new Response(JSON.stringify({ status: true, data: { status: 'pending' } }), { status: 200 }) : new Response(JSON.stringify({ status: false, message: 'nope' }), { status: 400 });
    if (url.includes('/slot_credits?id=eq.')) return new Response(JSON.stringify([{ user_id: STUDENT, listing_id: 'l1' }]), { status: 200 });
    if (url.includes('/location_access_payments')) return new Response(null, { status: 201 });
    if (url.includes('/rpc/get_support_admin_id')) return new Response(JSON.stringify(SUPPORT), { status: 200 });
    if (url.includes('/conversations') && method === 'GET') return new Response(JSON.stringify([{ id: 'conv-1' }]), { status: 200 });
    if (url.includes('/listings')) return new Response(JSON.stringify([{ title: 'Royal Lodge, 2-bed' }]), { status: 200 });
    if (url.endsWith('/messages') && method === 'POST') return new Response(null, { status: 201 });
    return new Response('unexpected', { status: 500 });
  }) as unknown as typeof fetch;
}

const messages = () => calls.filter((call) => call.url.endsWith('/messages') && call.method === 'POST').map((call) => JSON.parse(call.body ?? '{}'));
const refunds = () => calls.filter((call) => call.url.includes('/refund'));
const unlocks = () => calls.filter((call) => call.url.includes('/location_access_payments'));
const attemptPatches = () => calls.filter((call) => call.url.includes('/payment_attempts') && call.method === 'PATCH').map((call) => JSON.parse(call.body ?? '{}').status);

describe('confirmSlotPayment: a reservation that can take the payment', () => {
  it('asks the database what the payment means instead of updating the reservation itself', async () => {
    mockDb({ decision: 'paid' });
    await confirmSlotPayment(env, 'c1', 'ref');
    expect(calls.some((call) => call.url.includes('/rpc/confirm_slot_payment'))).toBe(true);
    expect(calls.some((call) => call.method === 'PATCH' && call.url.includes('/slot_credits'))).toBe(false);
  });

  it('records the payment, unlocks the location and sends one receipt on the first confirmation', async () => {
    mockDb({ decision: 'paid' });
    const result = await confirmSlotPayment(env, 'c1', 'ref', { paidBy: 'parent', amountKobo: 25_000_000 });
    expect(result).toEqual({ confirmed: true, locationUnlocked: true });
    expect(attemptPatches()).toEqual(['paid']);
    expect(unlocks()).toHaveLength(1);
    expect(messages()).toHaveLength(1);
    expect(messages()[0]).toMatchObject({ sender_id: SUPPORT, conversation_id: 'conv-1' });
    expect(messages()[0].body).toContain('your parent just paid');
    expect(refunds()).toHaveLength(0);
  });

  it('sends nothing more when the reservation was already paid (webhook and verify both fire)', async () => {
    mockDb({ decision: 'already_paid' });
    const result = await confirmSlotPayment(env, 'c1', 'ref');
    expect(result.confirmed).toBe(true);
    expect(messages()).toHaveLength(0);
    expect(attemptPatches()).toEqual([]);
    expect(refunds()).toHaveLength(0);
  });

  it('still confirms the payment when the receipt cannot be sent', async () => {
    mockDb({ decision: 'paid' });
    const original = global.fetch;
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes('/rpc/get_support_admin_id')) throw new Error('network down');
      return original(input, init);
    }) as unknown as typeof fetch;
    expect(await confirmSlotPayment(env, 'c1', 'ref')).toEqual({ confirmed: true, locationUnlocked: true });
  });

  it('reports a failure, without touching Paystack, when the database cannot be reached', async () => {
    mockDb({ decision: 'paid' });
    const original = global.fetch;
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
      String(input).includes('/rpc/confirm_slot_payment') ? new Response('boom', { status: 500 }) : original(input, init)) as unknown as typeof fetch;
    expect(await confirmSlotPayment(env, 'c1', 'ref')).toEqual({ confirmed: false, locationUnlocked: false });
    expect(refunds()).toHaveLength(0);
  });
});

describe('confirmSlotPayment: money for a reservation that cannot take it', () => {
  it('refunds the payment, marks it refunded and tells the student', async () => {
    mockDb({ decision: 'refund' });
    const result = await confirmSlotPayment(env, 'c1', 'GIDA-REF-1', { amountKobo: 25_000_000 });
    expect(result).toEqual({ confirmed: false, locationUnlocked: false, refunded: true });
    expect(JSON.parse(refunds()[0].body ?? '{}')).toEqual({ transaction: 'GIDA-REF-1' });
    expect(attemptPatches()).toEqual(['refunded']);
    expect(messages()[0].body).toContain('refunding it in full');
    expect(messages()[0].body).toContain('₦250,000');
  });

  it('never unlocks the location or sends a receipt for a reservation that ended', async () => {
    mockDb({ decision: 'refund' });
    await confirmSlotPayment(env, 'c1', 'ref');
    expect(unlocks()).toHaveLength(0);
    expect(messages().some((m) => /spot is secured/i.test(m.body))).toBe(false);
  });

  it('does not refund the same payment twice when the webhook and the verify call both arrive', async () => {
    mockDb({ decision: 'refund', attemptStatus: 'refunded' });
    const result = await confirmSlotPayment(env, 'c1', 'ref');
    expect(result.refunded).toBe(true);
    expect(refunds()).toHaveLength(0);
    expect(messages()).toHaveLength(0);
  });

  it('flags a refund Paystack would not take, so a person can follow it up, and does not claim success', async () => {
    mockDb({ decision: 'refund', refundOk: false });
    const result = await confirmSlotPayment(env, 'c1', 'ref');
    expect(result).toEqual({ confirmed: false, locationUnlocked: false, refunded: false });
    expect(attemptPatches()).toEqual(['refund_failed']);
    expect(messages()).toHaveLength(0);
  });
});

describe('receiptBody', () => {
  it('words parent and student receipts differently', () => {
    expect(receiptBody({ placeTitle: 'Royal Lodge, 2-bed', amountKobo: 25_000_000, paidBy: 'parent' }))
      .toBe('Good news: your parent just paid ₦250,000 for Royal Lodge. Your spot is secured.');
    expect(receiptBody({ placeTitle: null, paidBy: 'student' })).toBe('Payment received for your place. Your spot is secured.');
  });

  it('says plainly that a late payment is being refunded', () => {
    expect(receiptBody({ placeTitle: 'Royal Lodge, 2-bed', amountKobo: 25_000_000, paidBy: 'student', outcome: 'refunded' }))
      .toBe('Your payment of ₦250,000 for Royal Lodge reached us after the reservation had ended, so we are refunding it in full. A refund can take a few days to reach the account it came from.');
    expect(receiptBody({ placeTitle: 'Royal Lodge', paidBy: 'parent', outcome: 'refunded' })).toContain('A payment from your parent for Royal Lodge');
  });
});
