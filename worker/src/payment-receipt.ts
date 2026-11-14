import type { Env } from './env';

export type ReceiptInput = {
  studentId: string;
  listingId: string;
  amountKobo?: number;
  paidBy: 'parent' | 'student';
  /** 'refunded': the money arrived after the reservation had ended and is being given back. */
  outcome?: 'paid' | 'refunded';
};

const naira = (kobo: number): string => `₦${Math.round(kobo / 100).toLocaleString('en-NG')}`;

export function receiptBody(input: { placeTitle: string | null; amountKobo?: number; paidBy: 'parent' | 'student'; outcome?: 'paid' | 'refunded' }): string {
  const place = input.placeTitle?.split(',')[0]?.trim() || 'your place';
  const amount = input.amountKobo ? `${naira(input.amountKobo)} ` : '';
  if (input.outcome === 'refunded') {
    const who = input.paidBy === 'parent' ? 'A payment from your parent' : 'Your payment';
    return `${who} of ${amount || ''}for ${place} reached us after the reservation had ended, so we are refunding it in full. A refund can take a few days to reach the account it came from.`.replace('of for', 'for');
  }
  return input.paidBy === 'parent'
    ? `Good news: your parent just paid ${amount}for ${place}. Your spot is secured.`
    : `Payment received${input.amountKobo ? `: ${naira(input.amountKobo)}` : ''} for ${place}. Your spot is secured.`;
}

function restHeaders(env: Env): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
}

async function getJson<T>(env: Env, path: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${path}`, { headers: restHeaders(env), ...init });
  if (!response.ok) {
    console.error(`[Receipt] ${path} failed: ${response.status} — ${await response.text()}`);
    return null;
  }
  return (await response.json()) as T;
}

/**
 * Posts a receipt into the student's Support thread. The existing message-push pipeline turns that
 * into a push notification. Never throws: a missed receipt must not fail a confirmed payment.
 */
export async function sendPaymentReceipt(env: Env, input: ReceiptInput): Promise<void> {
  try {
    const supportId = await getJson<string | null>(env, 'rpc/get_support_admin_id', { method: 'POST', body: '{}' });
    if (!supportId) return;

    const [first, second] = input.studentId < supportId ? [input.studentId, supportId] : [supportId, input.studentId];
    const pair = `participant_a=eq.${first}&participant_b=eq.${second}`;
    let conversations = await getJson<{ id: string }[]>(env, `conversations?${pair}&select=id`);
    if (conversations && conversations.length === 0) {
      conversations = await getJson<{ id: string }[]>(env, 'conversations?select=id', {
        method: 'POST',
        headers: { ...restHeaders(env), Prefer: 'return=representation' },
        body: JSON.stringify({ participant_a: first, participant_b: second }),
      });
    }
    const conversationId = conversations?.[0]?.id;
    if (!conversationId) return;

    const listings = await getJson<{ title: string | null }[]>(env, `listings?id=eq.${input.listingId}&select=title`);
    const body = receiptBody({ placeTitle: listings?.[0]?.title ?? null, amountKobo: input.amountKobo, paidBy: input.paidBy, outcome: input.outcome });
    await getJson(env, 'messages', {
      method: 'POST',
      headers: { ...restHeaders(env), Prefer: 'return=minimal' },
      body: JSON.stringify({ conversation_id: conversationId, sender_id: supportId, body, client_sent_at: Date.now() }),
    }).catch(() => null);
  } catch (error) {
    console.error('[Receipt] Failed to send receipt:', error instanceof Error ? error.message : String(error));
  }
}
