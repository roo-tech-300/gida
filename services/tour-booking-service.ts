import { supabase } from '@/lib/supabase';
import { currentUserId } from '@/services/liquidity-pod-service';
import { getOrCreateConversation, sendMessage } from '@/services/messageService';
import type { TourBooking, TourBookingWithListing, TourListingBrief } from '@/types/tour-booking';
import type { TourAttachment } from '@/types/messages';

export const GUIDED_TOUR_FEE_NGN = 2000;

export type TourAvailabilityEntry = {
  date: string;
  time: string;
  booked: number;
  adminUnavailable: boolean;
};

export type ReserveTourResult = {
  booking: TourBooking | null;
  error?: 'slot_full' | 'already_booked' | 'admin_unavailable' | 'listing_not_found' | 'no_location' | 'tours_disabled' | 'failed';
};

export async function fetchTourAvailability(listingId: string, adminId?: string | null, limit = 30): Promise<TourAvailabilityEntry[]> {
  const userId = await currentUserId();
  if (!userId || !listingId) {
    return [];
  }
  try {
    const params: Record<string, string> = { p_listing_id: listingId };
    if (adminId) {
      params.p_admin_id = adminId;
    }
    const { data, error } = await supabase.rpc('get_tour_availability', params);
    if (error || !data) {
      console.warn('[TourBooking] Availability fetch skipped:', error?.message ?? 'no data');
      return [];
    }
    return (data as { scheduled_date: string; scheduled_time: string; booked: number; admin_unavailable: boolean }[])
      .map((row) => ({
        date: row.scheduled_date,
        time: row.scheduled_time,
        booked: row.booked,
        adminUnavailable: row.admin_unavailable,
      }))
      .slice(0, limit);
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
    const listingBrief = await fetchTourListingBrief(args.listingId);
    if (!listingBrief) {
      return { booking: null, error: 'listing_not_found' };
    }

    // Check if listing has location enabled for tours
    if (listingBrief.latitude === null || listingBrief.longitude === null) {
      return { booking: null, error: 'no_location' };
    }

    // This RPC books a guided (admin-accompanied) tour, so the guided flag is
    // what gates it. Self-guided visits do not go through this flow.
    if (!listingBrief.enable_guided_tour) {
      return { booking: null, error: 'tours_disabled' };
    }

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
      if (message.includes('admin_unavailable')) {
        return { booking: null, error: 'admin_unavailable' };
      }
      if (message.includes('tours_disabled')) {
        return { booking: null, error: 'tours_disabled' };
      }
      if (message.includes('no_location')) {
        return { booking: null, error: 'no_location' };
      }
      if (message.includes('listing_not_found')) {
        return { booking: null, error: 'listing_not_found' };
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

export type TourBookingNotifyInput = {
  bookingId: string;
  adminId: string | null;
  listingId: string;
  date: string;
  time: string;
};

async function fetchTourListingBrief(listingId: string): Promise<TourListingBrief | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('title, location_landmark, city, primary_image, price_amount, latitude, longitude, enable_self_guided_tour, enable_guided_tour')
    .eq('id', listingId)
    .maybeSingle();
  if (error || !data) {
    console.warn('[TourBooking] Listing brief fetch skipped:', error?.message ?? 'not found');
    return null;
  }
  return data as TourListingBrief;
}

export async function notifyAdminOfTourBooking(input: TourBookingNotifyInput): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !input.adminId) {
    return;
  }
  try {
    const [listing, conversation] = await Promise.all([
      fetchTourListingBrief(input.listingId),
      getOrCreateConversation(userId, input.adminId),
    ]);

    const attachment: TourAttachment = {
      type: 'tour',
      bookingId: input.bookingId,
      listingId: input.listingId,
      title: listing?.title ?? 'Guided Tour',
      image: listing?.primary_image ?? null,
      location: [listing?.location_landmark, listing?.city].filter(Boolean).join(', '),
      date: input.date,
      time: input.time,
      reference: `GIDA-TR-${input.bookingId.slice(-4).toUpperCase()}`,
    };

    await sendMessage({
      conversationId: conversation.id,
      senderId: userId,
      body: 'Booked a tour',
      attachment,
      clientSentAt: Date.now(),
    });
  } catch (error) {
    console.error('[TourBooking] Failed to notify admin of tour booking:', error);
  }
}
