import type { Env } from './env';
import { corsPreflight, json } from './paystack-helpers';
import { handleInitialize } from './paystack-initialize';
import { handlePaystackEvents } from './paystack-router';

export async function handlePaystackRequest(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    if (
      (url.pathname.startsWith('/api/paystack/') || url.pathname.startsWith('/api/referral/')) &&
      request.method === 'OPTIONS'
    ) {
      return corsPreflight();
    }
    if (url.pathname === '/api/paystack/initialize' && request.method === 'POST') {
      return handleInitialize(request, env);
    }
    return handlePaystackEvents(request, env, url.pathname);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Paystack] Route error:', message);
    return json({ error: message }, 500);
  }
}
 