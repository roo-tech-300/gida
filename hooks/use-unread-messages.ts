import { useMemo } from 'react';

import { useConversations } from '@/hooks/use-conversations';

export function useUnreadMessages(): number {
  const { data, isError } = useConversations();

  return useMemo(() => {
    if (isError && !data) return 0;
    return (data ?? []).reduce((total, conversation) => total + Math.max(0, conversation.unreadCount), 0);
  }, [data, isError]);
}
