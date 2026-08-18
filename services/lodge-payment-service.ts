import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { currentUserId } from '@/services/liquidity-pod-service';

const DEV_USER_ID = 'usr-current-student';
const CALLBACK_ROUTE = 'property/location-unlock-callback';

function workerUrl(): string {
  return (process.env.EXPO_PUBLIC_WORKER_URL ?? '').replace(/\/$/, '');
}

export type InitializeLodgePaymentResult = {
  simulated: boolean;
  authorizationUrl?: string;
  reference?: string;
};

export type VerifyLodgePaymentResult = {
  verified: boolean;
};

function buildLodgeCallbackUrl(listingId: string, creditId: string, targetOccupancy: number): string {
  const params = new URLSearchParams({
    listingId,
    creditId,
    targetOccupancy: String(targetOccupancy),
    kind: 'lodge',
  }).toString();
  if (Platform.OS === 'web') {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
    if (origin) {
      return `${origin}/${CALLBACK_ROUTE}?${params}`;
    }
  }
  return `gida://${CALLBACK_ROUTE}?${params}`;
}

export async function initializeLodgePayment(
  creditId: string,
  listingId: string,
  targetOccupancy: number,
): Promise<InitializeLodgePaymentResult> {
  const userId = await currentUserId();
  if (userId === DEV_USER_ID || !workerUrl()) {
    return { simulated: true };
  }

  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) {
    throw new Error('You must be signed in to pay.');
  }

  const callbackUrl = buildLodgeCallbackUrl(listingId, creditId, targetOccupancy);

  const response = await fetch(`${workerUrl()}/api/paystack/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      listingId,
      email,
      callbackUrl,
      kind: 'lodge',
      slotCreditId: creditId,
    }),
  });
  if (!response.ok) {
    throw new Error('Payment service is unavailable. Please try again.');
  }

  const result = (await response.json()) as { authorizationUrl?: string; reference?: string };
  if (!result.authorizationUrl || !result.reference) {
    throw new Error('Payment service returned an invalid response.');
  }
  return { simulated: false, authorizationUrl: result.authorizationUrl, reference: result.reference };
}

export async function verifyLodgePayment(reference: string): Promise<VerifyLodgePaymentResult> {
  if (!workerUrl()) {
    return { verified: false };
  }
  try {
    const response = await fetch(`${workerUrl()}/api/paystack/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    });
    if (!response.ok) {
      return { verified: false };
    }
    const result = (await response.json()) as { unlocked?: boolean; kind?: string };
    return { verified: result.unlocked === true && result.kind === 'lodge' };
  } catch (error) {
    console.error('[LodgePayment] Failed to verify payment:', error);
    return { verified: false };
  }
}
