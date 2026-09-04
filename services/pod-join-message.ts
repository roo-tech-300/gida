import { supabase } from '@/lib/supabase';
import { getOrCreateConversation, sendMessage } from '@/services/messageService';
import { mapDbToFeedListing } from '@/types/feed-listing';
import type { DbListing } from '@/types/feed-listing';
import type { PodJoinAttachment } from '@/types/messages';

export type PodJoinSource = 'code' | 'recommendation';

export type PodJoinDmInput = {
  podId: string;
  joinerUserId: string;
  founderUserId: string;
  joinerName?: string;
  listing: DbListing;
  source: PodJoinSource;
  seatNumber: number;
  totalSeats: number;
};

function bodyForSource(joinerName: string, source: PodJoinSource): string {
  return source === 'code'
    ? `${joinerName} just joined via your invite code`
    : `${joinerName} just joined your group`;
}

async function resolveJoinerName(userId: string, fallback?: string): Promise<string> {
  if (fallback) return fallback;
  try {
    const { data, error } = await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle();
    if (error || !data?.full_name) return 'Someone';
    return data.full_name;
  } catch (error) {
    console.error('[PodJoinMessage] Failed to resolve joiner name:', error);
    return 'Someone';
  }
}

export async function notifyFounderOfJoiner(input: PodJoinDmInput): Promise<void> {
  try {
    const [conversation, joinerName] = await Promise.all([
      getOrCreateConversation(input.joinerUserId, input.founderUserId),
      resolveJoinerName(input.joinerUserId, input.joinerName),
    ]);
    const feed = mapDbToFeedListing(input.listing);

    const attachment: PodJoinAttachment = {
      type: 'pod_join',
      podId: input.podId,
      listingId: input.listing.id,
      title: feed.title,
      image: feed.image || null,
      location: feed.location,
      joinerName,
      source: input.source,
      seatNumber: input.seatNumber,
      totalSeats: input.totalSeats,
    };

    await sendMessage({
      conversationId: conversation.id,
      senderId: input.joinerUserId,
      body: bodyForSource(joinerName, input.source),
      attachment,
      clientSentAt: Date.now(),
    });
  } catch (error) {
    console.error('[PodJoinMessage] Failed to notify founder of joiner:', error);
  }
}
