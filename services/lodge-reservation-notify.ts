import { supabase } from '@/lib/supabase';
import { getOrCreateConversation, sendMessage } from '@/services/messageService';
import { currentUserId } from '@/services/liquidity-pod-service';
import type { LodgeReservationAttachment, LodgeDecisionAttachment } from '@/types/messages';

type NotifyAdminInput = {
  creditId: string;
  listingId: string;
  userName: string;
};

export async function notifyAdminOfReservation(input: NotifyAdminInput): Promise<void> {
  console.log('[NotifyAdmin] 6. notifyAdminOfReservation called — creditId:', input.creditId, 'listingId:', input.listingId);
  const userId = await currentUserId();
  console.log('[NotifyAdmin] 6a. currentUserId:', userId);
  if (!userId) {
    console.error('[NotifyAdmin] 6a. ABORT — no userId (not signed in)');
    return;
  }

  try {
    console.log('[NotifyAdmin] 6b. Fetching listing...');
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, primary_image, location_landmark, city, admin_id')
      .eq('id', input.listingId)
      .maybeSingle();

    if (listingError) {
      console.error('[NotifyAdmin] 6c. Listing fetch ERROR:', listingError.message, listingError.code);
      return;
    }
    console.log('[NotifyAdmin] 6c. Listing fetched — admin_id:', listing?.admin_id, 'title:', listing?.title);
    if (!listing?.admin_id) {
      console.error('[NotifyAdmin] 6d. ABORT — listing has no admin_id');
      return;
    }

    console.log('[NotifyAdmin] 6e. Getting/creating conversation between userId:', userId, 'and adminId:', listing.admin_id);
    const conversation = await getOrCreateConversation(userId, listing.admin_id);
    console.log('[NotifyAdmin] 6f. Conversation ready — id:', conversation.id);

    const attachment: LodgeReservationAttachment = {
      type: 'lodge_reservation',
      creditId: input.creditId,
      listingId: input.listingId,
      title: listing.title ?? 'Gida Property',
      image: listing.primary_image ?? null,
      location: [listing.location_landmark, listing.city].filter(Boolean).join(', '),
      userName: input.userName,
    };

    console.log('[NotifyAdmin] 6g. Sending message to conversation:', conversation.id, 'senderId:', userId);
    await sendMessage({
      conversationId: conversation.id,
      senderId: userId,
      body: 'Applied for a lodge spot — awaiting your review',
      attachment,
      clientSentAt: Date.now(),
    });
    console.log('[NotifyAdmin] 6h. Message sent successfully');
  } catch (error) {
    console.error('[NotifyAdmin] 6 FAILED:', error);
  }
}

type NotifyUserInput = {
  adminId: string;
  userId: string;
  listingId: string;
  creditId: string;
  decision: 'accepted' | 'rejected';
  reason?: string;
};

export async function notifyUserOfDecision(input: NotifyUserInput): Promise<void> {
  console.log('[NotifyUser] Decision notify called — adminId:', input.adminId, 'userId:', input.userId, 'decision:', input.decision);
  try {
    console.log('[NotifyUser] Fetching listing...');
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, primary_image')
      .eq('id', input.listingId)
      .maybeSingle();

    if (listingError) {
      console.error('[NotifyUser] Listing fetch ERROR:', listingError.message);
    }
    console.log('[NotifyUser] Listing:', listing?.title);

    console.log('[NotifyUser] Getting/creating conversation...');
    const conversation = await getOrCreateConversation(input.adminId, input.userId);
    console.log('[NotifyUser] Conversation id:', conversation.id);

    const attachment: LodgeDecisionAttachment = {
      type: 'lodge_decision',
      creditId: input.creditId,
      listingId: input.listingId,
      title: listing?.title ?? 'Gida Property',
      image: listing?.primary_image ?? null,
      decision: input.decision,
      reason: input.reason,
    };

    const body = input.decision === 'accepted'
      ? `Your application for ${listing?.title ?? 'the property'} has been approved — you can now complete payment.`
      : `Your application for ${listing?.title ?? 'the property'} was not approved.${input.reason ? ` Reason: ${input.reason}` : ''}`;

    console.log('[NotifyUser] Sending message...');
    await sendMessage({
      conversationId: conversation.id,
      senderId: input.adminId,
      body,
      attachment,
      clientSentAt: Date.now(),
    });
    console.log('[NotifyUser] Message sent successfully');
  } catch (error) {
    console.error('[NotifyUser] FAILED:', error);
  }
}
