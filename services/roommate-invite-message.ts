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
  inviterGender?: 'MALE' | 'FEMALE' | null;
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

async function resolveInviterGender(userId: string, fallback?: 'MALE' | 'FEMALE' | null): Promise<'MALE' | 'FEMALE' | null> {
  if (fallback) return fallback;
  try {
    const { data, error } = await supabase.from('profiles').select('gender').eq('id', userId).maybeSingle();
    if (error || !data?.gender) return null;
    return data.gender as 'MALE' | 'FEMALE';
  } catch (error) {
    console.error('[RoommateInviteDm] Failed to resolve inviter gender:', error);
    return null;
  }
}

async function checkInviteeHasExistingSlot(inviteeUserId: string, listingId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('slot_credits')
      .select('id')
      .eq('user_id', inviteeUserId)
      .eq('listing_id', listingId)
      .not('status', 'eq', 'expired')
      .maybeSingle();
    if (error) {
      console.error('[RoommateInviteDm] Failed to check existing slot:', error);
      return false;
    }
    return Boolean(data);
  } catch (error) {
    console.error('[RoommateInviteDm] Exception checking existing slot:', error);
    return false;
  }
}

function buildSwapMessageBody(inviterName: string, inviterGender: 'MALE' | 'FEMALE' | null): string {
  if (inviterGender === 'MALE') {
    return `${inviterName} invited you to be his roommate — would you like to leave your current room and be with him?`;
  }
  if (inviterGender === 'FEMALE') {
    return `${inviterName} invited you to be her roommate — would you like to leave your current room and be with her?`;
  }
  return `${inviterName} invited you to be roommates — would you like to leave your current room and join them?`;
}

export async function sendRoommateInviteDm(input: RoommateInviteDmInput): Promise<void> {
  try {
    const [conversation, inviterName, inviterGender, hasExistingSlot] = await Promise.all([
      getOrCreateConversation(input.inviterUserId, input.inviteeUserId),
      resolveInviterName(input.inviterUserId, input.inviterName),
      resolveInviterGender(input.inviterUserId, input.inviterGender),
      checkInviteeHasExistingSlot(input.inviteeUserId, input.listing.id),
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
      hasExistingSlot,
      inviterGender,
    };

    const body = hasExistingSlot
      ? buildSwapMessageBody(inviterName, inviterGender)
      : `${inviterName} invited you to be roommates.`;

    await sendMessage({
      conversationId: conversation.id,
      senderId: input.inviterUserId,
      body,
      attachment,
      clientSentAt: Date.now(),
    });
  } catch (error) {
    console.error('[RoommateInviteDm] Failed to send roommate invite message:', error);
  }
}
