import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';

import { useAppToast } from '@/components/ui/toast-card';
import { useAuth } from '@/context/auth-context';
import { getPendingOutbox, markMessageFailed, markOutboxSynced } from '@/services/offline-outbox-store';
import { getOrCreateConversation, sendMessage } from '@/services/messageService';

type MessageSyncContextValue = {
  flushOutbox: () => Promise<void>;
  isFlushing: boolean;
};

const MessageSyncContext = createContext<MessageSyncContextValue>({
  flushOutbox: async () => {},
  isFlushing: false,
});

export function useMessageSync(): MessageSyncContextValue {
  return useContext(MessageSyncContext);
}

export function MessageSyncProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const myId = profile?.id;
  const queryClient = useQueryClient();
  const { isConnected } = useNetInfo();
  const { showToast } = useAppToast();
  const [isFlushing, setIsFlushing] = useState(false);
  const flushingRef = useRef(false);

  const flushOutbox = useCallback(async (): Promise<void> => {
    if (!myId || flushingRef.current) return;

    const pending = getPendingOutbox();
    if (pending.length === 0) return;

    flushingRef.current = true;
    setIsFlushing(true);
    let failedCount = 0;

    for (const queued of pending) {
      try {
        const conversation = await getOrCreateConversation(myId, queued.otherUserId);
        const sent = await sendMessage({
          conversationId: conversation.id,
          senderId: myId,
          body: queued.body,
          attachment: queued.attachment,
          clientSentAt: queued.clientSentAt,
        });
        markOutboxSynced(queued.id, sent.id, conversation.id, sent.createdAt, sent.readAt);
        queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
      } catch (error) {
        console.error('[MessageSync] Failed to flush queued message:', error);
        markMessageFailed(queued.id);
        failedCount += 1;
      }
    }

    flushingRef.current = false;
    setIsFlushing(false);
    queryClient.invalidateQueries({ queryKey: ['conversations', myId] });

    if (failedCount > 0) {
      showToast({ message: `${failedCount} queued message${failedCount > 1 ? 's' : ''} could not be sent yet.`, type: 'error' });
    }
  }, [myId, queryClient, showToast]);

  useEffect(() => {
    if (isConnected) void flushOutbox();
  }, [isConnected, flushOutbox]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void flushOutbox();
    });
    return () => subscription.remove();
  }, [flushOutbox]);

  const value = useMemo(() => ({ flushOutbox, isFlushing }), [flushOutbox, isFlushing]);

  return <MessageSyncContext.Provider value={value}>{children}</MessageSyncContext.Provider>;
}