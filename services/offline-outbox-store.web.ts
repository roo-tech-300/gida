import type { ChatMessage, MessageAttachment, QueuedOutboundMessage } from '@/types/messages';
import { nextLocalStamp, parseAttachment } from '@/services/offline-message-store';

export type OutboxInput = {
  id?: string;
  conversationId: string | null;
  otherUserId: string;
  senderId: string;
  body: string;
  attachment: MessageAttachment | null;
  clientSentAt: number;
};

export function createOutboxMessage(input: OutboxInput): ChatMessage {
  const id = input.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    id,
    conversationId: input.conversationId ?? '',
    senderId: input.senderId,
    body: input.body,
    attachment: input.attachment,
    createdAt: new Date(input.clientSentAt).toISOString(),
    clientSentAt: input.clientSentAt,
    localCreatedAt: nextLocalStamp(),
    readAt: null,
    status: 'outbox',
  };
}

export function getPendingOutbox(): QueuedOutboundMessage[] {
  return [];
}

export function markOutboxSynced(_localId: string, _serverId: string, _conversationId: string, _serverCreatedAt: string, _readAt: string | null): void {}

export function markMessageFailed(_id: string): void {}
