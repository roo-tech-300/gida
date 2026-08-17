import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { currentUserId } from '@/services/liquidity-pod-service';

const DEV_USER_ID = 'usr-current-student';
const CALLBACK_ROUTE = 'property/location-unlock-callback';

function workerUrl(): string {
  return (process.env.EXPO_PUBLIC_WORKER_URL ?? '').replace(/\/$/, '');
}

export type InitializeLocationPaymentResult = {
  simulated: boolean;
  authorizationUrl?: string;
  reference?: string;
};

export type VerifyPaymentResult = {
  unlocked: boolean;
  kind: 'location' | 'tour';
  bookingId?: string;
};

export function buildCallbackUrl(listingId: string, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams({ listingId, ...extra }).toString();
  if (Platform.OS === 'web') {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
    if (origin) {
      return `${origin}/${CALLBACK_ROUTE}?${params}`;
    }
  }
  return `gida://${CALLBACK_ROUTE}?${params}`;
}

export async function fetchUnlockedListingIds(): Promise<string[]> {
  const userId = await currentUserId();
  if (userId === DEV_USER_ID || !workerUrl()) {
    return [];
  }
  try {
    const { data, error } = await supabase.from('location_access_payments').select('listing_id').eq('user_id', userId);
    if (error || !data) {
      return [];
    }
    return data.map((row) => row.listing_id);
  } catch (error) {
    console.error('[LocationAccess] Failed to fetch unlocked listings:', error);
    return [];
  }
}

export async function unlockLocationForLodge(args: { creditId: string; listingId: string }): Promise<boolean> {
  const userId = await currentUserId();
  if (userId === DEV_USER_ID) {
    return true;
  }
  try {
    const { error } = await supabase.from('location_access_payments').insert({
      user_id: userId,
      listing_id: args.listingId,
      amount_paid: 0,
      method: 'lodge',
      reference: `GIDA-LODGE-${args.creditId}`,
    });
    if (error) {
      console.warn('[LocationAccess] Lodge unlock insert skipped:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[LocationAccess] Failed to record lodge unlock:', error);
    return false;
  }
}

export async function initializeLocationPayment(listingId: string): Promise<InitializeLocationPaymentResult> {
  const userId = await currentUserId();
  if (userId === DEV_USER_ID || !workerUrl()) {
    return { simulated: true };
  }

  const { data: existingAccess } = await supabase
    .from('location_access_payments')
    .select('id')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .maybeSingle();
  if (existingAccess) {
    throw new Error('Location access is already unlocked for this property.');
  }

  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) {
    throw new Error('You must be signed in to unlock location access.');
  }

  const response = await fetch(`${workerUrl()}/api/paystack/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, listingId, email, callbackUrl: buildCallbackUrl(listingId) }),
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

export async function verifyLocationPayment(reference: string): Promise<VerifyPaymentResult> {
  if (!workerUrl()) {
    return { unlocked: false, kind: 'location' };
  }
  try {
    const response = await fetch(`${workerUrl()}/api/paystack/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    });
    if (!response.ok) {
      return { unlocked: false, kind: 'location' };
    }
    const result = (await response.json()) as { unlocked?: boolean; kind?: string; bookingId?: string };
    return {
      unlocked: result.unlocked === true,
      kind: result.kind === 'tour' ? 'tour' : 'location',
      bookingId: result.bookingId,
    };
  } catch (error) {
    console.error('[LocationAccess] Failed to verify payment:', error);
    return { unlocked: false, kind: 'location' };
  }
}
