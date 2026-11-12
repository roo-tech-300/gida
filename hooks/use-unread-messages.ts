import { useMemo } from 'react';

import { useConversations } from '@/hooks/use-conversations';
import { useHouseholdChats } from '@/hooks/use-household-chats';

export function useUnreadMessages(): number {
  const { data, isError } = useConversations();
  const households = useHouseholdChats();

  return useMemo(() => {
    const direct = isError && !data ? 0 : (data ?? []).reduce((total, conversation) => total + Math.max(0, conversation.unreadCount), 0);
    const group = (households.data ?? []).reduce((total, chat) => total + chat.unreadCount, 0);
    return direct + group;
  }, [data, isError, households.data]);
}
