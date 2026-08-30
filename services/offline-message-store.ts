import * as SQLite from 'expo-sqlite';

import type { ChatMessage, Conversation, MessageAttachment, ServerChatMessage } from '@/types/messages';

const DB_NAME = 'gida_offline.db';
export const SENT_PREVIEW_FALLBACK = 'Shared a listing';

export type LocalMessageRow = {
  id: string;
  conversation_id: string | null;
  other_user_id: string | null;
  sender_id: string;
  body: string | null;
  attachment: string | null;
  client_sent_at: number;
  local_created_at: number;
  status: string;
  server_created_at: string | null;
  read_at: string | null;
};

type LocalThreadRow = {
  conversation_id: string;
  other_user_id: string;
  other_name: string;
  other_avatar_url: string | null;
  last_local_created_at: number;
  preview: string;
  preview_sender_id: string | null;
  unread: number;
};

let db: SQLite.SQLiteDatabase | null = null;
let lastLocalStamp = 0;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
    db.execSync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS local_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        other_user_id TEXT,
        sender_id TEXT NOT NULL,
        body TEXT,
        attachment TEXT,
        client_sent_at INTEGER NOT NULL,
        local_created_at INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'synced',
        server_created_at TEXT,
        read_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_local_messages_conv ON local_messages (conversation_id, local_created_at, client_sent_at);
      CREATE INDEX IF NOT EXISTS idx_local_messages_other ON local_messages (other_user_id);
      CREATE INDEX IF NOT EXISTS idx_local_messages_twin ON local_messages (client_sent_at, sender_id, conversation_id);
      CREATE TABLE IF NOT EXISTS local_threads (
        conversation_id TEXT PRIMARY KEY,
        other_user_id TEXT NOT NULL,
        other_name TEXT NOT NULL,
        other_avatar_url TEXT,
        last_local_created_at INTEGER NOT NULL,
        preview TEXT NOT NULL DEFAULT '',
        preview_sender_id TEXT,
        unread INTEGER NOT NULL DEFAULT 0
      );
    `);
  }
  return db;
}

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

export function toChatMessage(row: LocalMessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id ?? '',
    senderId: row.sender_id,
    body: row.body ?? '',
    attachment: parseAttachment(row.attachment),
    createdAt: row.server_created_at ?? new Date(row.client_sent_at).toISOString(),
    clientSentAt: row.client_sent_at,
    localCreatedAt: row.local_created_at,
    readAt: row.read_at,
    status: row.status === 'outbox' || row.status === 'failed' ? (row.status as ChatMessage['status']) : undefined,
  };
}

export function updateThreadPreview(database: SQLite.SQLiteDatabase, conversationId: string): void {
  const latest = database.getFirstSync<{ local_created_at: number; body: string | null; sender_id: string }>(
    `SELECT local_created_at, body, sender_id
       FROM local_messages
      WHERE conversation_id = ?
      ORDER BY local_created_at DESC, client_sent_at DESC, id DESC
      LIMIT 1`,
    [conversationId],
  );
  if (!latest) return;
  database.runSync(
    `UPDATE local_threads
        SET last_local_created_at = ?, preview = ?, preview_sender_id = ?
      WHERE conversation_id = ?`,
    [latest.local_created_at, latest.body?.trim() || SENT_PREVIEW_FALLBACK, latest.sender_id, conversationId],
  );
}

export function getMessagesForConversation(conversationId: string): ChatMessage[] {
  const rows = getDb().getAllSync<LocalMessageRow>(
    `SELECT * FROM local_messages
      WHERE conversation_id = ?
      ORDER BY local_created_at ASC, client_sent_at ASC, id ASC`,
    [conversationId],
  );
  return rows.map(toChatMessage);
}

function promoteQueuedTwin(database: SQLite.SQLiteDatabase, conversationId: string, message: ServerChatMessage): boolean {
  const twin = database.getFirstSync<LocalMessageRow>(
    `SELECT * FROM local_messages
      WHERE status IN ('outbox','failed') AND conversation_id = ? AND sender_id = ? AND client_sent_at = ?
      ORDER BY local_created_at ASC
      LIMIT 1`,
    [conversationId, message.senderId, message.clientSentAt],
  );
  if (!twin) return false;
  database.runSync(
    `UPDATE local_messages
        SET id = ?, body = ?, attachment = ?, client_sent_at = ?, server_created_at = ?, read_at = ?, status = 'synced', other_user_id = NULL
      WHERE id = ?`,
    [message.id, message.body, message.attachment ? JSON.stringify(message.attachment) : null, message.clientSentAt, message.createdAt, message.readAt, twin.id],
  );
  return true;
}

export function saveIncomingMessages(conversationId: string, incoming: ServerChatMessage[]): ChatMessage[] {
  const database = getDb();
  for (const message of incoming) {
    const existing = database.getFirstSync<LocalMessageRow>('SELECT * FROM local_messages WHERE id = ?', [message.id]);
    if (existing) {
      database.runSync(
        `UPDATE local_messages
            SET conversation_id = ?, body = ?, attachment = ?, client_sent_at = ?,
                server_created_at = ?, read_at = ?,
                status = CASE WHEN status IN ('outbox','failed') THEN 'synced' ELSE status END
          WHERE id = ?`,
        [conversationId, message.body, message.attachment ? JSON.stringify(message.attachment) : null, message.clientSentAt, message.createdAt, message.readAt, message.id],
      );
    } else if (promoteQueuedTwin(database, conversationId, message)) {
      // skip: queued twin was renamed to the confirmed server id, keeping its original local ordering stamp.
    } else {
      database.runSync(
        `INSERT INTO local_messages
           (id, conversation_id, other_user_id, sender_id, body, attachment, client_sent_at, local_created_at, status, server_created_at, read_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
        [message.id, conversationId, null, message.senderId, message.body, message.attachment ? JSON.stringify(message.attachment) : null, message.clientSentAt, nextLocalStamp(), message.createdAt, message.readAt],
      );
    }
  }
  updateThreadPreview(database, conversationId);
  return getMessagesForConversation(conversationId);
}

export function upsertThreadFromConversation(conversation: Conversation): void {
  const database = getDb();
  const serverTime = Date.parse(conversation.lastMessageAt) || Date.now();
  database.runSync(
    `INSERT INTO local_threads
       (conversation_id, other_user_id, other_name, other_avatar_url, last_local_created_at, preview, preview_sender_id, unread)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(conversation_id) DO UPDATE SET
       other_name = excluded.other_name,
       other_avatar_url = excluded.other_avatar_url,
       preview = excluded.preview,
       preview_sender_id = excluded.preview_sender_id,
       unread = excluded.unread,
       last_local_created_at = MAX(local_threads.last_local_created_at, excluded.last_local_created_at)`,
    [conversation.id, conversation.participant.id, conversation.participant.name, conversation.participant.avatarUrl, serverTime, conversation.lastMessage, conversation.lastMessageSenderId, conversation.unreadCount],
  );
}

export function syncThreadsToStore(conversations: Conversation[]): void {
  for (const conversation of conversations) upsertThreadFromConversation(conversation);
}

export function getLocalSortKey(conversationId: string): number | null {
  const row = getDb().getFirstSync<{ last_local_created_at: number }>('SELECT last_local_created_at FROM local_threads WHERE conversation_id = ?', [conversationId]);
  return row?.last_local_created_at ?? null;
}

export function getOfflineThreads(): Conversation[] {
  const rows = getDb().getAllSync<LocalThreadRow>('SELECT * FROM local_threads ORDER BY last_local_created_at DESC');
  return rows.map((row) => {
    const at = new Date(row.last_local_created_at).toISOString();
    return {
      id: row.conversation_id,
      participant: { id: row.other_user_id, name: row.other_name, avatarUrl: row.other_avatar_url },
      lastMessage: row.preview,
      lastMessageAt: at,
      lastMessageSenderId: row.preview_sender_id ?? null,
      unreadCount: row.unread,
      createdAt: at,
    };
  });
}