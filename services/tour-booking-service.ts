import { supabase } from '@/lib/supabase';
import { buildCallbackUrl, type InitializeLocationPaymentResult } from '@/services/location-access-service';
import { currentUserId } from '@/services/liquidity-pod-service';
import type { TourBooking, TourBookingWithListing } from '@/types/tour-booking';

export const GUIDED_TOUR_FEE_NGN = 2000;

function workerUrl(): string {
  return (process.env.EXPO_PUBLIC_WORKER_URL ?? '').replace(/\/$/, '');
}

export type TourAvailabilityEntry = {
  date: string;
  time: string;
  booked: number;
};

export type ReserveTourResult = {
  booking: TourBooking | null;
  error?: 'slot_full' | 'already_booked' | 'failed';
};

export async function fetchTourAvailability(listingId: string): Promise<TourAvailabilityEntry[]> {
  const userId = await currentUserId();
  if (!userId || !listingId) {
    return [];
  }
  try {
    const { data, error } = await supabase.rpc('get_tour_availability', { p_listing_id: listingId });
    if (error || !data) {
      console.warn('[TourBooking] Availability fetch skipped:', error?.message ?? 'no data');
      return [];
    }
    return (data as { scheduled_date: string; scheduled_time: string; booked: number }[]).map((row) => ({
      date: row.scheduled_date,
      time: row.scheduled_time,
      booked: row.booked,
    }));
  } catch (error) {
    console.error('[TourBooking] Failed to fetch availability:', error);
    return [];
  }
}

export async function reserveTour(args: {
  listingId: string;
  adminId: string | null;
  date: string;
  time: string;
}): Promise<ReserveTourResult> {
  const userId = await currentUserId();
  if (!userId) {
    return { booking: null, error: 'failed' };
  }
  try {
    const { data, error } = await supabase.rpc('reserve_tour', {
      p_listing_id: args.listingId,
      p_admin_id: args.adminId,
      p_scheduled_date: args.date,
      p_scheduled_time: args.time,
    });
    if (error) {
      const message = error.message ?? '';
      if (message.includes('already_booked')) {
        return { booking: null, error: 'already_booked' };
      }
      if (message.includes('slot_full')) {
        return { booking: null, error: 'slot_full' };
      }
      if (message.includes('23505') || message.includes('duplicate')) {
        return { booking: null, error: 'already_booked' };
      }
      console.error('[TourBooking] reserve failed:', error);
      return { booking: null, error: 'failed' };
    }
    return { booking: data as TourBooking };
  } catch (error) {
    console.error('[TourBooking] reserve exception:', error);
    return { booking: null, error: 'failed' };
  }
}

export async function payForTour(args: {
  listingId: string;
  bookingId: string;
  date: string;
  time: string;
}): Promise<InitializeLocationPaymentResult> {
  const userId = await currentUserId();
  if (!workerUrl()) {
    return { simulated: true };
  }
  if (!userId) {
    throw new Error('You must be signed in to book a tour.');
  }

  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) {
    throw new Error('You must be signed in to book a tour.');
  }

  const callbackUrl = buildCallbackUrl(args.listingId, {
    kind: 'tour',
    bookingId: args.bookingId,
    date: args.date,
    time: args.time,
  });

  const response = await fetch(`${workerUrl()}/api/paystack/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      listingId: args.listingId,
      email,
      callbackUrl,
      kind: 'tour',
      tourBookingId: args.bookingId,
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

export async function fetchTourBookings(): Promise<TourBookingWithListing[]> {
  const userId = await currentUserId();
  if (!userId) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('tour_bookings')
      .select('*, listings(title, location_landmark, primary_image)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) {
      return [];
    }
    return data as TourBookingWithListing[];
  } catch (error) {
    console.error('[TourBooking] Failed to fetch bookings:', error);
    return [];
  }
}

export async function findPendingBooking(listingId: string): Promise<TourBooking | null> {
  const userId = await currentUserId();
  if (!userId) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('tour_bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .eq('status', 'pending_payment')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      return null;
    }
    return data as TourBooking;
  } catch (error) {
    console.error('[TourBooking] Failed to find pending booking:', error);
    return null;
  }
}
