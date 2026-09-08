import { useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { getMessagesForConversation, markLocalMessagesRead, saveIncomingMessages, upsertThreadFromConversation } from '@/services/offline-message-store';
import { createOutboxMessage, markMessageFailed, markOutboxSynced } from '@/services/offline-outbox-store';
import {
  fetchMessagesPaginated,
  getOrCreateConversation,
  markConversationRead,
  sendMessage,
  subscribeToConversationMessages,
  type SendMessageInput,
} from '@/services/messageService';
import type { ChatMessage, ListingAttachment, ServerChatMessage } from '@/types/messages';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';

export type SendDraft = {
  body: string;
  attachment: ListingAttachment | null;
};

function refreshThreadCache(queryClient: ReturnType<typeof useQueryClient>, conversationId: string): void {
  const localMessages = getMessagesForConversation(conversationId);
  const existingData = queryClient.getQueryData<InfiniteData<ChatMessage[]>>(['messages', conversationId]);
  // The messages list is backed by an *infinite* query, so the cache must hold
  // InfiniteData ({ pages, pageParams }) — writing a plain array here makes the
  // InfiniteQueryObserver crash in getNextPageParam (data.pages is undefined).
  //
  // We MERGE local messages with the existing server pages (id-deduped) so that
  // the cached server history is preserved and local state (outbox/realtime/read)
  // is layered on top, instead of being wiped by an empty local store on first paint.
  //
  // BUT: if the server hasn't populated the cache yet AND there is nothing local
  // to show, do NOT pre-seed an empty page. Doing so makes the observer report the
  // query as "loaded", which flashes the empty state while the fetch is in flight.
  if (!existingData && localMessages.length === 0) return;

  queryClient.setQueryData<InfiniteData<ChatMessage[]>>(['messages', conversationId], (oldData) => {
    const existing = (oldData?.pages ?? []).flat();
    const byId = new Map<string, ChatMessage>();
    for (const message of existing) byId.set(message.id, message);
    for (const message of localMessages) byId.set(message.id, message);
    const merged = [...byId.values()].sort(
      (a, b) => (a.localCreatedAt ?? a.clientSentAt) - (b.localCreatedAt ?? b.clientSentAt),
    );
    const pageParams =
      oldData && Array.isArray(oldData.pageParams) && oldData.pageParams.length > 0
        ? oldData.pageParams
        : [0];
    return { pages: [merged], pageParams };
  });
}

export function useConversationThread(otherId: string) {
  const { profile } = useAuth();
  const myId = profile?.id;
  const queryClient = useQueryClient();
  const { isConnected } = useNetInfo();

  const limit = 50; // page size for pagination

  const [unreadBoundaryId] = useState<string | null>(null);

  const conversationQuery = useQuery({
    queryKey: ['conversation-pair', myId, otherId],
    queryFn: () => getOrCreateConversation(myId!, otherId),
    enabled: !!myId && !!otherId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (conversationQuery.data) upsertThreadFromConversation(conversationQuery.data);
  }, [conversationQuery.data]);

  const conversationId = conversationQuery.data?.id;

  const messagesQuery = usePaginatedQuery<ServerChatMessage[]>({
    queryKey: ['messages', conversationId],
    queryFn: ({ from, to }) => fetchMessagesPaginated(conversationId!, from, to),
    limit,
    staleTime: 30 * 1000,
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId || !myId) return;
    void markConversationRead(conversationId, myId).then(() => {
      markLocalMessagesRead(conversationId, myId);
      refreshThreadCache(queryClient, conversationId);
      queryClient.invalidateQueries({ queryKey: ['conversations', myId] });
    });
  }, [conversationId, myId, queryClient]);

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = subscribeToConversationMessages(conversationId, (incoming) => {
      saveIncomingMessages(conversationId, [incoming]);
      refreshThreadCache(queryClient, conversationId);
    });
    return unsubscribe;
  }, [conversationId, queryClient]);

  const send = useMutation({
    mutationFn: async (draft: SendDraft): Promise<ChatMessage> => {
      if (!conversationId || !myId) throw new Error('Conversation is not ready yet.');

      const clientSentAt = Date.now();
      const local = createOutboxMessage({
        conversationId,
        otherUserId: otherId,
        senderId: myId,
        body: draft.body,
        attachment: draft.attachment,
        clientSentAt,
      });
      refreshThreadCache(queryClient, conversationId);

      if (isConnected === false) return local;

      try {
        const sent = await sendMessage({
          conversationId,
          senderId: myId,
          body: draft.body,
          attachment: draft.attachment,
          clientSentAt,
        } satisfies SendMessageInput);
        markOutboxSynced(local.id, sent.id, conversationId, sent.createdAt, sent.readAt);
        refreshThreadCache(queryClient, conversationId);
        return { ...sent, localCreatedAt: clientSentAt };
      } catch (error) {
        console.error('[MessageThread] Failed to send message:', error);
        markMessageFailed(local.id);
        refreshThreadCache(queryClient, conversationId);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', myId] });
    },
  });

  const messages = useMemo<ChatMessage[]>(() => {
    const pages = messagesQuery.data?.pages ?? [];
    // Dedupe by id across all pages, layering local optimistic/read state over
    // server data, then order by the local timestamp for a stable chat feed.
    const byId = new Map<string, ChatMessage>();
    for (const page of pages) {
      for (const message of page) {
        byId.set(message.id, { ...message, localCreatedAt: message.clientSentAt });
      }
    }
    return [...byId.values()].sort(
      (a, b) => (a.localCreatedAt ?? a.clientSentAt) - (b.localCreatedAt ?? b.clientSentAt),
    );
  }, [messagesQuery.data]);

  return {
    conversation: conversationQuery.data,
    participant: conversationQuery.data?.participant,
    messages,
    unreadBoundaryId,
    isConversationLoading: conversationQuery.isLoading,
    isConversationError: conversationQuery.isError,
    isMessagesLoading: messagesQuery.isLoading,
    isMessagesFetching: messagesQuery.isFetching,
    isMessagesError: messagesQuery.isError,
    isRefetching: messagesQuery.isRefetching,
    refetchMessages: () => messagesQuery.refetch(),
    sendMessage: send.mutateAsync,
    isSending: send.isPending,
    sendError: send.error,
  };
}