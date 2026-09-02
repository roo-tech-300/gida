import { supabase } from '@/lib/supabase';
import type { Conversation, ListingAttachment, MessageAttachment, ServerChatMessage } from '@/types/messages';

type ConversationRow = {
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

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment: ListingAttachment | null;
  created_at: string;
  client_sent_at: number | null;
  read_at: string | null;
};

type ProfileSummary = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function mapMessageRow(row: MessageRow): ServerChatMessage {
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

function mapConversationRow(row: ConversationRow, readerId: string, participant: ProfileSummary): Conversation {
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

async function fetchProfilesByIds(ids: string[]): Promise<Record<string, ProfileSummary>> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return {};

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', uniqueIds);

  if (error) throw error;

  const map: Record<string, ProfileSummary> = {};
  for (const row of data ?? []) {
    map[row.id] = {
      id: row.id,
      name: row.full_name || 'Gida user',
      avatarUrl: row.avatar_url || null,
    };
  }
  return map;
}

export async function getOrCreateConversation(myId: string, otherId: string): Promise<Conversation> {
  const [a, b] = normalizePair(myId, otherId);

  let { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('participant_a', a)
    .eq('participant_b', b)
    .maybeSingle();

  if (!data && !error) {
    const result = await supabase
      .from('conversations')
      .insert({ participant_a: a, participant_b: b })
      .select('*')
      .single();

    error = result.error;

    if (error?.code === '23505') {
      const refetch = await supabase
        .from('conversations')
        .select('*')
        .eq('participant_a', a)
        .eq('participant_b', b)
        .maybeSingle();
      data = refetch.data;
      error = refetch.error;
    } else {
      data = result.data as ConversationRow | null;
    }
  }

  if (error || !data) throw error ?? new Error('Could not create conversation.');

  const profiles = await fetchProfilesByIds([a, b]);
  const profile = profiles[otherId] ?? { id: otherId, name: 'Gida user', avatarUrl: null };
  return mapConversationRow(data, myId, profile);
}

export async function fetchMyConversations(myId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`participant_a.eq.${myId},participant_b.eq.${myId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(100);

  if (error) throw error;

  const rows = (data ?? []) as ConversationRow[];
  const otherIds = rows.map((row) => (row.participant_a === myId ? row.participant_b : row.participant_a));
  const profiles = await fetchProfilesByIds(otherIds);

  return rows
    .map((row) => {
      const otherId = row.participant_a === myId ? row.participant_b : row.participant_a;
      const profile = profiles[otherId] ?? { id: otherId, name: 'Gida user', avatarUrl: null };
      return mapConversationRow(row, myId, profile);
    })
    .filter((conversation) => conversation.lastMessageAt !== conversation.createdAt || conversation.lastMessage !== '');
}

export async function fetchConversationMessages(conversationId: string): Promise<ServerChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('client_sent_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapMessageRow(row as MessageRow));
}

export type SendMessageInput = {
  conversationId: string;
  senderId: string;
  body: string;
  attachment: MessageAttachment | null;
  clientSentAt: number;
};

export async function sendMessage(input: SendMessageInput): Promise<ServerChatMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      body: input.body.trim() || null,
      attachment: input.attachment,
      client_sent_at: input.clientSentAt,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapMessageRow(data as MessageRow);
}

export async function markConversationRead(conversationId: string, readerId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
    p_reader_id: readerId,
  });

  if (error) {
    console.error('[MessageService] Failed to mark conversation read:', error.message);
  }
}

let channelSeq = 0;

function uniqueChannelName(prefix: string): string {
  channelSeq += 1;
  return `${prefix}:${Date.now().toString(36)}-${channelSeq}`;
}

function attachSafeSubscribe(channel: ReturnType<typeof supabase.channel>): void {
  channel.subscribe((status, err) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      console.log(`[Messages] Realtime channel status: ${status}`, err ?? '');
    }
  });
}

export function subscribeToConversationMessages(
  conversationId: string,
  onInsert: (message: ServerChatMessage) => void,
): () => void {
  const channel = supabase
    .channel(uniqueChannelName(`messages:${conversationId}`))
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => onInsert(mapMessageRow(payload.new as MessageRow)),
    );
  attachSafeSubscribe(channel);

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeToConversationChanges(onChange: () => void): () => void {
  const channel = supabase
    .channel(uniqueChannelName('conversations-feed'))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, onChange)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, onChange);
  attachSafeSubscribe(channel);

  return () => {
    void supabase.removeChannel(channel);
  };
}