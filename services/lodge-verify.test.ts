import { verifyLodgePayment } from '@/services/lodge-payment-service';

function answer(body: unknown, ok = true) {
  global.fetch = jest.fn(async () => new Response(JSON.stringify(body), { status: ok ? 200 : 500 })) as unknown as typeof fetch;
}

describe('verifyLodgePayment', () => {
  const original = process.env.EXPO_PUBLIC_WORKER_URL;
  beforeEach(() => { process.env.EXPO_PUBLIC_WORKER_URL = 'http://worker.test'; });
  afterAll(() => { process.env.EXPO_PUBLIC_WORKER_URL = original; });

  it('reports a confirmed lodge payment as verified', async () => {
    answer({ unlocked: true, kind: 'lodge' });
    expect(await verifyLodgePayment('ref')).toEqual({ verified: true });
  });

  it('reports a payment that is being refunded because the reservation had ended', async () => {
    answer({ unlocked: false, status: 'refunded' });
    expect(await verifyLodgePayment('ref')).toEqual({ verified: false, refunded: true });
  });

  it('flags a refund that could not be started so the screen can send the person to Support', async () => {
    answer({ unlocked: false, status: 'refund-failed' });
    expect(await verifyLodgePayment('ref')).toEqual({ verified: false, refundFailed: true });
  });

  it('treats a server error as not verified', async () => {
    answer({ error: 'x' }, false);
    expect(await verifyLodgePayment('ref')).toEqual({ verified: false });
  });
});
