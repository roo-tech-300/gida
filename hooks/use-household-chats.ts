import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/auth-context';
import { fetchHouseholdChats } from '@/services/household-chat-service';

const HOUSEHOLD_CHATS_STALE_MS = 30 * 1000;

export const householdChatsKey = (userId: string | undefined) => ['household-chats', userId] as const;

/** The caller's household inbox rows (names, last message, unread). One RPC, cached. */
export function useHouseholdChats() {
  const { profile } = useAuth();
  const userId = profile?.id;
  return useQuery({
    queryKey: householdChatsKey(userId),
    queryFn: fetchHouseholdChats,
    enabled: !!userId,
    staleTime: HOUSEHOLD_CHATS_STALE_MS,
  });
}
