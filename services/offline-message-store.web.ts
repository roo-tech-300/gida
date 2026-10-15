import type { ChatMessage, Conversation, MessageAttachment, MessageReply, ServerChatMessage } from '@/types/messages';

export const SENT_PREVIEW_FALLBACK = 'Shared a listing';

export type LocalMessageRow = {
  id: string;
  conversation_id: string | null;
  other_user_id: string | null;
  sender_id: string;
  body: string | null;
  attachment: string | null;
  reply_to: string | null;
  client_sent_at: number;
  local_created_at: number;
  status: string;
  server_created_at: string | null;
  read_at: string | null;
  /** Kept for type parity with the native store; unused on web. */
  previous_local_id?: string | null;
};

let lastLocalStamp = 0;

export function nextLocalStamp(): number {
  const now = Date.now();
  lastLocalStamp = now > lastLocalStamp ? now : lastLocalStamp + 1;
  return lastLocalStamp;
}

export function parseAttachment(raw: string | null): MessageAttachment | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MessageAttachment;
  } catch (error) {
    console.error('[OfflineStore] Failed to parse attachment:', error);
    return null;
  }
}

export function parseReply(raw: string | null): MessageReply | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MessageReply;
  } catch (error) {
    console.error('[OfflineStore] Failed to parse reply:', error);
    return null;
  }
}

export function toChatMessage(row: LocalMessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id ?? '',
    senderId: row.sender_id,
    body: row.body ?? '',
    attachment: parseAttachment(row.attachment),
    replyTo: parseReply(row.reply_to),
    createdAt: row.server_created_at ?? new Date(row.client_sent_at).toISOString(),
    clientSentAt: row.client_sent_at,
    localCreatedAt: row.local_created_at,
    readAt: row.read_at,
    status: row.status === 'outbox' || row.status === 'failed' ? (row.status as ChatMessage['status']) : undefined,
  };
}

const conversationsByLocalStamp = new Map<string, ChatMessage[]>();

export function getMessagesForConversation(conversationId: string): ChatMessage[] {
  const stored = conversationsByLocalStamp.get(conversationId) ?? [];
  return [...stored].sort(
    (a, b) => (a.localCreatedAt ?? a.clientSentAt) - (b.localCreatedAt ?? b.clientSentAt),
  );
}

export function saveIncomingMessages(_conversationId: string, incoming: ServerChatMessage[]): ChatMessage[] {
  const existing = conversationsByLocalStamp.get(_conversationId) ?? [];
  const byId = new Map(existing.map((message) => [message.id, message]));
  for (const message of incoming) {
    byId.set(message.id, {
      id: message.id,
      conversationId: _conversationId,
      senderId: message.senderId,
      body: message.body,
      attachment: message.attachment,
      replyTo: message.replyTo,
      createdAt: message.createdAt,
      clientSentAt: message.clientSentAt,
      localCreatedAt: message.clientSentAt,
      readAt: message.readAt,
      status: undefined,
    });
  }
  const merged = [...byId.values()].sort((a, b) => a.clientSentAt - b.clientSentAt);
  conversationsByLocalStamp.set(_conversationId, merged);
  return getMessagesForConversation(_conversationId);
}

export function markLocalMessagesRead(_conversationId: string, _readerId: string): void {}

/**
 * Web shim: the in-memory store never renames a queued row to a server id
 * (see createOutboxMessage — nothing is persisted), so there are never any
 * superseded device ids to drop from the React Query cache.
 */
export function getSupersededLocalIds(_conversationId: string): Set<string> {
  return new Set();
}

export function upsertThreadFromConversation(_conversation: Conversation): void {}

export function syncThreadsToStore(_conversations: Conversation[]): void {}

export function getLocalSortKey(_conversationId: string): number | null {
  return null;
}

export function getOfflineThreads(): Conversation[] {
  return [];
}
