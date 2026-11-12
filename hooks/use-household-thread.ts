import { useEffect, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/auth-context';
import { householdChatsKey, useHouseholdChats } from '@/hooks/use-household-chats';
import {
  fetchHouseholdMessages,
  HOUSEHOLD_PAGE_SIZE,
  markHouseholdRead,
  sendHouseholdMessage,
  subscribeToHousehold,
} from '@/services/household-chat-service';
import type { HouseholdMessage } from '@/types/household-chat';

const messagesKey = (podId: string) => ['household-messages', podId] as const;

/** Messages, sending, read-marking and live updates for one household chat. */
export function useHouseholdThread(podId: string) {
  const { profile } = useAuth();
  const myId = profile?.id;
  const queryClient = useQueryClient();
  const chats = useHouseholdChats();
  const chat = chats.data?.find((item) => item.podId === podId);

  const messagesQuery = useInfiniteQuery({
    queryKey: messagesKey(podId),
    queryFn: ({ pageParam }) => fetchHouseholdMessages(podId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.length < HOUSEHOLD_PAGE_SIZE ? undefined : lastPage[lastPage.length - 1]?.createdAt),
    enabled: !!podId && !!myId && !!chat,
    staleTime: 15 * 1000,
  });

  // Live updates: someone posted, so reload the newest page and the inbox row.
  useEffect(() => {
    if (!podId) return;
    return subscribeToHousehold(podId, () => {
      void queryClient.invalidateQueries({ queryKey: messagesKey(podId) });
      void queryClient.invalidateQueries({ queryKey: householdChatsKey(myId) });
    });
  }, [podId, myId, queryClient]);

  // Opening the chat, or receiving a message while it is open, clears the unread count.
  const newestId = messagesQuery.data?.pages[0]?.[0]?.id;
  const isMember = !!chat;
  useEffect(() => {
    if (!podId || !myId || !isMember) return;
    void markHouseholdRead(podId).then(() => queryClient.invalidateQueries({ queryKey: householdChatsKey(myId) }));
  }, [podId, myId, isMember, newestId, queryClient]);

  const send = useMutation({
    mutationFn: (body: string) => sendHouseholdMessage(podId, myId!, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: messagesKey(podId) });
      void queryClient.invalidateQueries({ queryKey: householdChatsKey(myId) });
    },
  });

  const messages = useMemo<HouseholdMessage[]>(() => {
    const seen = new Map<string, HouseholdMessage>();
    for (const page of messagesQuery.data?.pages ?? []) for (const message of page) seen.set(message.id, message);
    return [...seen.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [messagesQuery.data]);

  return {
    chat,
    myId,
    messages,
    isLoading: chats.isLoading || (!!chat && messagesQuery.isLoading),
    isError: messagesQuery.isError,
    refetch: messagesQuery.refetch,
    hasNextPage: Boolean(messagesQuery.hasNextPage),
    isFetchingNextPage: messagesQuery.isFetchingNextPage,
    fetchNextPage: messagesQuery.fetchNextPage,
    sendMessage: send.mutateAsync,
    isSending: send.isPending,
  };
}
