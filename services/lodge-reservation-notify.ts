import { supabase } from '@/lib/supabase';
import { getOrCreateConversation, sendMessage } from '@/services/messageService';
import { currentUserId } from '@/services/liquidity-pod-service';
import type { LodgeReservationAttachment, LodgeDecisionAttachment } from '@/types/messages';

type NotifyAdminInput = {
  podId: string;
  listingId: string;
  userName: string;
};

export async function notifyAdminOfReservation(input: NotifyAdminInput): Promise<void> {
  console.log('[NotifyAdmin] notifyAdminOfReservation called — podId:', input.podId, 'listingId:', input.listingId);
  const userId = await currentUserId();
  if (!userId) {
    console.error('[NotifyAdmin] ABORT — no userId (not signed in)');
    return;
  }

  try {
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, primary_image, location_landmark, city, admin_id')
      .eq('id', input.listingId)
      .maybeSingle();

    if (listingError) {
      console.error('[NotifyAdmin] Listing fetch ERROR:', listingError.message, listingError.code);
      return;
    }
    if (!listing?.admin_id) {
      console.error('[NotifyAdmin] ABORT — listing has no admin_id');
      return;
    }

    const conversation = await getOrCreateConversation(userId, listing.admin_id);

    const attachment: LodgeReservationAttachment = {
      type: 'lodge_reservation',
      podId: input.podId,
      listingId: input.listingId,
      title: listing.title ?? 'Gida Property',
      image: listing.primary_image ?? null,
      location: [listing.location_landmark, listing.city].filter(Boolean).join(', '),
      userName: input.userName,
    };

    await sendMessage({
      conversationId: conversation.id,
      senderId: userId,
      body: 'Applied for a lodge spot — awaiting your review',
      attachment,
      clientSentAt: Date.now(),
    });
  } catch (error) {
    console.error('[NotifyAdmin] FAILED:', error);
  }
}

type NotifyUserInput = {
  adminId: string;
  userId: string;
  listingId: string;
  podId: string;
  decision: 'accepted' | 'rejected';
  reason?: string;
};

export async function notifyUserOfDecision(input: NotifyUserInput): Promise<void> {
  try {
    const { data: listing } = await supabase
      .from('listings')
      .select('id, title, primary_image')
      .eq('id', input.listingId)
      .maybeSingle();

    const conversation = await getOrCreateConversation(input.adminId, input.userId);

    const attachment: LodgeDecisionAttachment = {
      type: 'lodge_decision',
      podId: input.podId,
      listingId: input.listingId,
      title: listing?.title ?? 'Gida Property',
      image: listing?.primary_image ?? null,
      decision: input.decision,
      reason: input.reason,
    };

    const body = input.decision === 'accepted'
      ? `Your application for ${listing?.title ?? 'the property'} has been approved — you can now complete payment.`
      : `Your application for ${listing?.title ?? 'the property'} was not approved.${input.reason ? ` Reason: ${input.reason}` : ''}`;

    await sendMessage({
      conversationId: conversation.id,
      senderId: input.adminId,
      body,
      attachment,
      clientSentAt: Date.now(),
    });
  } catch (error) {
    console.error('[NotifyUser] FAILED:', error);
  }
}
