import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/context/auth-context';
import { getLocalSortKey, getOfflineThreads, syncThreadsToStore } from '@/services/offline-message-store';
import { fetchMyConversations, subscribeToConversationChanges } from '@/services/messageService';
import type { Conversation } from '@/types/messages';

function reconcileThreads(server: Conversation[]): Conversation[] {
  syncThreadsToStore(server);
  return [...server].sort((a, b) => threadSortMs(b) - threadSortMs(a));
}

function threadSortMs(conversation: Conversation): number {
  const localKey = getLocalSortKey(conversation.id);
  return (localKey ?? Date.parse(conversation.lastMessageAt) ?? 0) as number;
}

export function useConversations() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      if (!userId) return [];
      const stored = getOfflineThreads();
      try {
        return reconcileThreads(await fetchMyConversations(userId));
      } catch (error) {
        console.error('[Conversations] Failed to fetch threads:', error);
        if (stored.length > 0) return stored;
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToConversationChanges(() => {
      void queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
    });
    return unsubscribe;
  }, [userId, queryClient]);

  return query;
}