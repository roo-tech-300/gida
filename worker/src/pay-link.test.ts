import type { Env } from './env';
import { handlePayLinkRequest } from './pay-link';

const TOKEN = '29e9e4de27194f7faeb1ec12864f747d';
const env: Env = {
  SUPABASE_URL: 'http://db.local',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  PAYSTACK_SECRET_KEY: 'sk_test',
  PAYSTACK_BASE_URL: 'http://paystack.local',
  PAY_PAGE_ORIGIN: 'https://pay.example',
};

const openLink = {
  status: 'open', credit_id: 'c1', student_id: 's1', listing_id: 'l1', listing_title: 'Royal Lodge',
  location: 'Bosso', student_first_name: 'Ada', amount: 250000, deadline: '2026-11-14T05:33:00Z', target_occupancy: 4,
};

type FetchCall = { url: string; init?: RequestInit };
let calls: FetchCall[] = [];

const newAttempt = { decision: 'new', attempt_id: 'att-1', reference: 'GIDA-LODGE-abc', authorization_url: null, attempt_status: 'initializing', amount_ngn: 250000, is_new: true };

/** `claim` is what claim_payment_attempt answers: whether this reservation can be paid at all. */
function mockFetch(link: Record<string, unknown>, paystackOk = true, claim: Record<string, unknown> = newAttempt) {
  calls = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.includes('/rpc/get_payment_link')) return new Response(JSON.stringify(link), { status: 200 });
    if (url.includes('/rpc/claim_payment_attempt')) return new Response(JSON.stringify([claim]), { status: 200 });
    if (url.includes('/payment_attempts') && init?.method === 'PATCH') return new Response(null, { status: 204 });
    if (url.includes('/transaction/initialize')) {
      return paystackOk
        ? new Response(JSON.stringify({ status: true, data: { authorization_url: 'http://pay/checkout/r1', reference: 'r1' } }), { status: 200 })
        : new Response(JSON.stringify({ status: false, message: 'nope' }), { status: 400 });
    }
    return new Response('unexpected', { status: 500 });
  }) as unknown as typeof fetch;
}

let ipCounter = 0;
function request(path: string, init: RequestInit = {}): Request {
  ipCounter += 1; // a fresh client per test so the rate limiter never interferes
  return new Request(`http://worker.local${path}`, { ...init, headers: { 'CF-Connecting-IP': `10.0.0.${ipCounter}`, 'Content-Type': 'application/json' } });
}

describe('GET /api/pay/:token', () => {
  it('returns only the public summary, never user or reservation ids', async () => {
    mockFetch(openLink);
    const response = await handlePayLinkRequest(request(`/api/pay/${TOKEN}`), env);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: 'open', listingTitle: 'Royal Lodge', location: 'Bosso', studentFirstName: 'Ada',
      amount: 250000, deadline: '2026-11-14T05:33:00Z', targetOccupancy: 4,
    });
    expect(JSON.stringify(body)).not.toMatch(/s1|c1|l1"/);
  });

  it('returns 404 for an unknown token', async () => {
    mockFetch({ status: 'not_found' });
    const response = await handlePayLinkRequest(request(`/api/pay/${TOKEN}`), env);
    expect(response.status).toBe(404);
  });

  it('rejects malformed tokens without touching the database', async () => {
    mockFetch(openLink);
    const response = await handlePayLinkRequest(request('/api/pay/not-a-token'), env);
    expect(response.status).toBe(404);
    expect(calls).toHaveLength(0);
  });
});

describe('POST /api/pay/:token/initialize', () => {
  it('starts Paystack with the reservation metadata and the parent email', async () => {
    mockFetch(openLink);
    const response = await handlePayLinkRequest(request(`/api/pay/${TOKEN}/initialize`, { method: 'POST', body: JSON.stringify({ email: 'mum@example.com' }) }), env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authorizationUrl: 'http://pay/checkout/r1', reference: 'r1' });
    const sent = JSON.parse(String(calls.find((call) => call.url.includes('/transaction/initialize'))?.init?.body));
    expect(sent).toMatchObject({
      email: 'mum@example.com', amount: 25000000, reference: 'GIDA-LODGE-abc', callback_url: `https://pay.example/pay/${TOKEN}`,
      metadata: { kind: 'lodge', userId: 's1', listingId: 'l1', slotCreditId: 'c1', paidBy: 'parent' },
    });
  });

  it.each(['paid', 'expired', 'not_ready'])('refuses a %s link', async (status) => {
    mockFetch({ ...openLink, status });
    const response = await handlePayLinkRequest(request(`/api/pay/${TOKEN}/initialize`, { method: 'POST', body: JSON.stringify({ email: 'mum@example.com' }) }), env);
    expect(response.status).toBe(409);
    expect(calls.some((call) => call.url.includes('/transaction/initialize'))).toBe(false);
  });

  it('rejects an invalid email before any lookup', async () => {
    mockFetch(openLink);
    const response = await handlePayLinkRequest(request(`/api/pay/${TOKEN}/initialize`, { method: 'POST', body: JSON.stringify({ email: 'nope' }) }), env);
    expect(response.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('surfaces a Paystack failure as 502 and marks the attempt failed so a new one can start', async () => {
    mockFetch(openLink, false);
    const response = await handlePayLinkRequest(request(`/api/pay/${TOKEN}/initialize`, { method: 'POST', body: JSON.stringify({ email: 'mum@example.com' }) }), env);
    expect(response.status).toBe(502);
    const patch = calls.find((call) => call.url.includes('/payment_attempts') && call.init?.method === 'PATCH');
    expect(JSON.parse(String(patch?.init?.body)).status).toBe('failed');
  });

  it('records the attempt as pending with its checkout address once Paystack answers', async () => {
    mockFetch(openLink);
    await handlePayLinkRequest(request(`/api/pay/${TOKEN}/initialize`, { method: 'POST', body: JSON.stringify({ email: 'mum@example.com' }) }), env);
    const patch = calls.find((call) => call.url.includes('/payment_attempts') && call.init?.method === 'PATCH');
    expect(JSON.parse(String(patch?.init?.body))).toMatchObject({ status: 'pending', authorization_url: 'http://pay/checkout/r1' });
  });

  it.each(['not_payable', 'already_paid', 'not_found'])('never starts a payment the database says cannot land (%s)', async (decision) => {
    mockFetch(openLink, true, { ...newAttempt, decision });
    const response = await handlePayLinkRequest(request(`/api/pay/${TOKEN}/initialize`, { method: 'POST', body: JSON.stringify({ email: 'mum@example.com' }) }), env);
    expect([404, 409]).toContain(response.status);
    expect(calls.some((call) => call.url.includes('/transaction/initialize'))).toBe(false);
  });

  it('hands back the checkout already open instead of starting a second one', async () => {
    mockFetch(openLink, true, { ...newAttempt, decision: 'reuse', authorization_url: 'http://pay/checkout/existing', reference: 'GIDA-LODGE-old' });
    const response = await handlePayLinkRequest(request(`/api/pay/${TOKEN}/initialize`, { method: 'POST', body: JSON.stringify({ email: 'mum@example.com' }) }), env);
    expect(await response.json()).toEqual({ authorizationUrl: 'http://pay/checkout/existing', reference: 'GIDA-LODGE-old' });
    expect(calls.some((call) => call.url.includes('/transaction/initialize'))).toBe(false);
  });
});

describe('rate limiting', () => {
  it('returns 429 once a client exceeds the per-minute limit', async () => {
    mockFetch(openLink);
    const headers = { 'CF-Connecting-IP': '10.9.9.9' };
    let last = 200;
    for (let i = 0; i < 35; i += 1) {
      const response = await handlePayLinkRequest(new Request(`http://worker.local/api/pay/${TOKEN}`, { headers }), env);
      last = response.status;
    }
    expect(last).toBe(429);
  });
});
