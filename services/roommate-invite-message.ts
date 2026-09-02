import { supabase } from '@/lib/supabase';
import { getOrCreateConversation, sendMessage } from '@/services/messageService';
import { mapDbToFeedListing } from '@/types/feed-listing';
import type { DbListing } from '@/types/feed-listing';
import type { RoommateInviteAttachment } from '@/types/messages';

export type RoommateInviteDmInput = {
  inviterUserId: string;
  inviteeUserId: string;
  inviterName?: string;
  listing: DbListing;
};

async function resolveInviterName(userId: string, fallback?: string): Promise<string> {
  if (fallback) return fallback;
  try {
    const { data, error } = await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle();
    if (error || !data?.full_name) return 'Someone';
    return data.full_name;
  } catch (error) {
    console.error('[RoommateInviteDm] Failed to resolve inviter name:', error);
    return 'Someone';
  }
}

export async function sendRoommateInviteDm(input: RoommateInviteDmInput): Promise<void> {
  try {
    const [conversation, inviterName] = await Promise.all([
      getOrCreateConversation(input.inviterUserId, input.inviteeUserId),
      resolveInviterName(input.inviterUserId, input.inviterName),
    ]);
    const feed = mapDbToFeedListing(input.listing);

    const attachment: RoommateInviteAttachment = {
      type: 'roommate_invite',
      listingId: input.listing.id,
      title: feed.title,
      image: feed.image || null,
      price: feed.price,
      location: feed.location,
      inviterName,
    };

    await sendMessage({
      conversationId: conversation.id,
      senderId: input.inviterUserId,
      body: `${inviterName} invited you to be roommates.`,
      attachment,
      clientSentAt: Date.now(),
    });
  } catch (error) {
    console.error('[RoommateInviteDm] Failed to send roommate invite message:', error);
  }
}

