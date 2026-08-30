import type { ChatMessage, MessageAttachment, QueuedOutboundMessage } from '@/types/messages';
import {
  getDb,
  nextLocalStamp,
  parseAttachment,
  toChatMessage,
  updateThreadPreview,
  type LocalMessageRow,
} from '@/services/offline-message-store';

export type OutboxInput = {
  id?: string;
  conversationId: string | null;
  otherUserId: string;
  senderId: string;
  body: string;
  attachment: MessageAttachment | null;
  clientSentAt: number;
};

function parseOutboxRow(row: LocalMessageRow): QueuedOutboundMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id ?? null,
    otherUserId: row.other_user_id!,
    senderId: row.sender_id,
    body: row.body ?? '',
    attachment: parseAttachment(row.attachment),
    clientSentAt: row.client_sent_at,
  };
}

export function createOutboxMessage(input: OutboxInput): ChatMessage {
  const database = getDb();
  const id = input.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  database.runSync(
    `INSERT OR IGNORE INTO local_messages
       (id, conversation_id, other_user_id, sender_id, body, attachment, client_sent_at, local_created_at, status, server_created_at, read_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'outbox', NULL, NULL)`,
    [id, input.conversationId, input.otherUserId, input.senderId, input.body, input.attachment ? JSON.stringify(input.attachment) : null, input.clientSentAt, nextLocalStamp()],
  );
  const row = database.getFirstSync<LocalMessageRow>('SELECT * FROM local_messages WHERE id = ?', [id])!;
  if (input.conversationId) updateThreadPreview(database, input.conversationId);
  return toChatMessage(row);
}

export function getPendingOutbox(): QueuedOutboundMessage[] {
  const rows = getDb().getAllSync<LocalMessageRow>(
    `SELECT * FROM local_messages
      WHERE status IN ('outbox','failed') AND other_user_id IS NOT NULL
      ORDER BY local_created_at ASC`,
  );
  return rows.map(parseOutboxRow);
}

export function markOutboxSynced(localId: string, serverId: string, conversationId: string, serverCreatedAt: string, readAt: string | null): void {
  const database = getDb();
  const newId = serverId && serverId !== localId ? serverId : localId;
  database.runSync(
    `UPDATE local_messages
        SET id = ?, conversation_id = ?, status = 'synced', server_created_at = ?, read_at = ?
      WHERE id = ?`,
    [newId, conversationId, serverCreatedAt, readAt, localId],
  );
  updateThreadPreview(database, conversationId);
}

export function markMessageFailed(id: string): void {
  getDb().runSync(`UPDATE local_messages SET status = 'failed' WHERE id = ?`, [id]);
}