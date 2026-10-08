import { Platform } from 'react-native';

import { buildCallbackUrl, type InitializeLocationPaymentResult } from '@/services/location-access-service';
import { currentUserId } from '@/services/liquidity-pod-service';
import { getPaymentAuthorizationHeader } from '@/services/payment-api';
import { supabase } from '@/lib/supabase';

function workerUrl(): string {
  return (process.env.EXPO_PUBLIC_WORKER_URL ?? '').replace(/\/$/, '');
}

export async function payForTour(args: {
  listingId: string;
  bookingId: string;
  date: string;
  time: string;
}): Promise<InitializeLocationPaymentResult> {
  const userId = await currentUserId();
  if (!workerUrl()) return { simulated: true };
  if (!userId) throw new Error('You must be signed in to book a tour.');

  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) throw new Error('You must be signed in to book a tour.');

  const callbackUrl = buildCallbackUrl(args.listingId, {
    kind: 'tour',
    bookingId: args.bookingId,
    date: args.date,
    time: args.time,
  });
  const authHeaders = await getPaymentAuthorizationHeader();
  const response = await fetch(`${workerUrl()}/api/paystack/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      userId,
      listingId: args.listingId,
      email,
      callbackUrl,
      kind: 'tour',
      tourBookingId: args.bookingId,
    }),
  });
  const result = (await response.json()) as { error?: string; authorizationUrl?: string; reference?: string };
  if (!response.ok) throw new Error(result.error ?? 'Payment service is unavailable. Please try again.');
  if (!result.authorizationUrl || !result.reference) throw new Error('Payment service returned an invalid response.');
  return { simulated: false, authorizationUrl: result.authorizationUrl, reference: result.reference };
}
