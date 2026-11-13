import type { Conversation, ListingAttachment, ServerChatMessage } from '@/types/messages';
import { fetchProfilesInChunks } from '@/utils/profile-chunking';

export type ConversationRow = {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender_id: string | null;
  unread_a: number;
  unread_b: number;
  created_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment: ListingAttachment | null;
  created_at: string;
  client_sent_at: number | null;
  read_at: string | null;
};

// Keep in sync with ConversationRow / MessageRow above. Explicit columns avoid
// fetching jsonb and bookkeeping fields (reply_to, updated_at) the app never reads.
export const CONVERSATION_COLUMNS =
  'id, participant_a, participant_b, last_message_at, last_message_preview, last_message_sender_id, unread_a, unread_b, created_at';
export const MESSAGE_COLUMNS =
  'id, conversation_id, sender_id, body, attachment, created_at, client_sent_at, read_at';

export type ProfileSummary = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function mapMessageRow(row: MessageRow): ServerChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body ?? '',
    attachment: row.attachment,
    createdAt: row.created_at,
    clientSentAt: row.client_sent_at ?? Date.parse(row.created_at),
    readAt: row.read_at,
  };
}

export function mapConversationRow(row: ConversationRow, readerId: string, participant: ProfileSummary): Conversation {
  const isReaderA = row.participant_a === readerId;
  const otherId = isReaderA ? row.participant_b : row.participant_a;
  const other = otherId === participant.id ? participant : { id: otherId, name: 'Gida user', avatarUrl: null };

  return {
    id: row.id,
    participant: other,
    lastMessage: row.last_message_preview ?? '',
    lastMessageAt: row.last_message_at ?? row.created_at,
    lastMessageSenderId: row.last_message_sender_id,
    unreadCount: isReaderA ? (row.unread_a ?? 0) : (row.unread_b ?? 0),
    createdAt: row.created_at,
  };
}

export async function fetchProfilesByIds(ids: string[]): Promise<Record<string, ProfileSummary>> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return {};

  const profiles = await fetchProfilesInChunks(uniqueIds);
  const map: Record<string, ProfileSummary> = {};
  for (const [id, profile] of Object.entries(profiles)) {
    map[id] = {
      id,
      name: profile.full_name || 'Gida user',
      avatarUrl: profile.avatar_url || null,
    };
  }
  return map;
}
