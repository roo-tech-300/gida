import type { Env } from './env';
import { json } from './paystack-helpers';
import { handleVerify, handleWebhook } from './paystack-events';

export function handlePaystackEvents(request: Request, env: Env, path: string): Promise<Response> {
  if (path === '/api/paystack/verify' && request.method === 'POST') return handleVerify(request, env);
  if (path === '/api/paystack/webhook' && request.method === 'POST') return handleWebhook(request, env);
  return Promise.resolve(json({ error: 'Not found.' }, 404));
}
