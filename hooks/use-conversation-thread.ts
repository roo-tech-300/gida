import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import { useEffect } from 'react';

import { useAuth } from '@/context/auth-context';
import { getMessagesForConversation, saveIncomingMessages, upsertThreadFromConversation } from '@/services/offline-message-store';
import { createOutboxMessage, markMessageFailed, markOutboxSynced } from '@/services/offline-outbox-store';
import {
  fetchConversationMessages,
  getOrCreateConversation,
  markConversationRead,
  sendMessage,
  subscribeToConversationMessages,
  type SendMessageInput,
} from '@/services/messageService';
import type { ChatMessage, ListingAttachment } from '@/types/messages';

export type SendDraft = {
  body: string;
  attachment: ListingAttachment | null;
};

function refreshThreadCache(queryClient: ReturnType<typeof useQueryClient>, conversationId: string): void {
  queryClient.setQueryData<ChatMessage[]>(['messages', conversationId], getMessagesForConversation(conversationId));
}

export function useConversationThread(otherId: string) {
  const { profile } = useAuth();
  const myId = profile?.id;
  const queryClient = useQueryClient();
  const { isConnected } = useNetInfo();

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

  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const stored = getMessagesForConversation(conversationId);
      try {
        const server = await fetchConversationMessages(conversationId);
        return saveIncomingMessages(conversationId, server);
      } catch (error) {
        console.error('[MessageThread] Failed to fetch messages:', error);
        if (stored.length > 0) return stored;
        throw error;
      }
    },
    enabled: !!conversationId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!conversationId || !myId) return;
    void markConversationRead(conversationId, myId).then(() => {
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

  return {
    conversation: conversationQuery.data,
    participant: conversationQuery.data?.participant,
    messages: messagesQuery.data ?? [],
    isConversationLoading: conversationQuery.isLoading,
    isConversationError: conversationQuery.isError,
    isMessagesLoading: messagesQuery.isLoading,
    isMessagesError: messagesQuery.isError,
    isRefetching: messagesQuery.isRefetching,
    refetchMessages: () => messagesQuery.refetch(),
    sendMessage: send.mutateAsync,
    isSending: send.isPending,
    sendError: send.error,
  };
}