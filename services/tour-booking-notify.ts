import { supabase } from '@/lib/supabase';
import { currentUserId } from '@/services/liquidity-pod-service';
import { getOrCreateConversation, sendMessage } from '@/services/messageService';
import type { TourListingBrief } from '@/types/tour-booking';
import type { TourAttachment } from '@/types/messages';

export type TourBookingNotifyInput = {
  bookingId: string;
  adminId: string | null;
  listingId: string;
  date: string;
  time: string;
};

export async function fetchTourListingBrief(listingId: string): Promise<TourListingBrief | null> {
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
