import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { buildPayUrl } from '@/utils/payment-link';

export type PayLinkStatus = 'open' | 'paid' | 'expired' | 'not_ready' | 'not_found';

export interface PayLinkSummary {
  status: PayLinkStatus;
  listingTitle: string | null;
  location: string | null;
  studentFirstName: string | null;
  amount: number | null;
  deadline: string | null;
  targetOccupancy: number | null;
}

export interface CreatedPaymentLink {
  token: string;
  url: string;
  expiresAt: string;
}

function workerUrl(): string {
  return (process.env.EXPO_PUBLIC_WORKER_URL ?? '').replace(/\/$/, '');
}

function payOrigin(): string | undefined {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return process.env.EXPO_PUBLIC_PAY_PAGE_ORIGIN;
}

/** Student side: get (or reuse) the shareable link for a reservation. */
export async function createPaymentLink(creditId: string): Promise<CreatedPaymentLink> {
  const { data, error } = await supabase.rpc('create_payment_link', { p_credit_id: creditId });
  if (error) {
    console.error('[PaymentLink] create_payment_link failed:', error.message);
    throw new Error(error.message || 'Could not create a payment link.');
  }
  const result = data as { token?: string; expires_at?: string } | null;
  if (!result?.token || !result.expires_at) {
    throw new Error('Could not create a payment link.');
  }
  return { token: result.token, url: buildPayUrl(payOrigin(), result.token), expiresAt: result.expires_at };
}

/** Parent side (no account): what the pay page shows. */
export async function fetchPayLinkSummary(token: string): Promise<PayLinkSummary> {
  if (!workerUrl()) {
    throw new Error('Payments are not available right now.');
  }
  const response = await fetch(`${workerUrl()}/api/pay/${token}`);
  if (response.status === 404) {
    return { status: 'not_found', listingTitle: null, location: null, studentFirstName: null, amount: null, deadline: null, targetOccupancy: null };
  }
  if (!response.ok) {
    throw new Error('We could not load this payment link. Please try again.');
  }
  return (await response.json()) as PayLinkSummary;
}

/** Parent side: start a Paystack payment and return where to send the browser. */
export async function startParentPayment(token: string, email: string): Promise<string> {
  const response = await fetch(`${workerUrl()}/api/pay/${token}/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const body = (await response.json().catch(() => null)) as { authorizationUrl?: string; error?: string } | null;
  if (!response.ok || !body?.authorizationUrl) {
    throw new Error(body?.error ?? 'Payment service is unavailable. Please try again.');
  }
  return body.authorizationUrl;
}
