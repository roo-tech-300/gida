import type { Env } from './env';
import { json } from './paystack-helpers';
import { handlePaystackEvents } from './paystack-router';
import { handleInitialize } from './paystack-initialize';

export async function handlePaystackRequest(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/paystack/') && request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-paystack-signature',
          'Access-Control-Max-Age': '86400',
        },
      });
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
