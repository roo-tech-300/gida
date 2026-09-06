import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { fetchMessagesPaginated } from '@/services/messageService';
import type { ServerChatMessage } from '@/types/messages';

export function useMessagesPaginated(conversationId: string, limit = 50) {
  return usePaginatedQuery<ServerChatMessage[]>({
    queryKey: ['messages', conversationId, limit],
    queryFn: ({ from, to }) => fetchMessagesPaginated(conversationId, from, to),
    limit,
    staleTime: 2 * 60 * 1000,
    enabled: !!conversationId,
  });
}