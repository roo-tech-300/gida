import { supabase } from '@/lib/supabase';
import type { MessageAttachment, ServerChatMessage } from '@/types/messages';
import { onMessage, onTokenRefresh, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { getNativeMessaging } from './native-messaging';
import { upsertDeviceToken } from './token-service';
import {
    NOOP_UNSUBSCRIBE,
    type ForegroundMessageHandler,
    type ForegroundRemoteMessage,
    type MessageReceivedHandler,
    type NotificationSubscription,
} from './types';

const backgroundMessaging = getNativeMessaging();
if (backgroundMessaging) {
  try {
    setBackgroundMessageHandler(backgroundMessaging, async (remoteMessage) => {
      console.log('[Notifications] Background message received:', remoteMessage.messageId ?? 'no message id');
    });
  } catch (error) {
    console.error('[Notifications] Failed to register background handler:', error);
  }
}

const safeUnsubscribe = (label: string, unsubscribe: NotificationSubscription | undefined): void => {
  try {
    unsubscribe?.();
  } catch (error) {
    console.error(`[Notifications] Failed to unsubscribe from ${label}:`, error);
  }
};

type RealtimeMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment: MessageAttachment | null;
  created_at: string;
  client_sent_at: number | null;
  read_at: string | null;
};

const mapRealtimeMessage = (row: RealtimeMessageRow): ServerChatMessage => ({
  id: row.id,
  conversationId: row.conversation_id,
  senderId: row.sender_id,
  body: row.body ?? '',
  attachment: row.attachment,
  createdAt: row.created_at,
  clientSentAt: row.client_sent_at ?? Date.parse(row.created_at),
  readAt: row.read_at,
});

let messageChannelSequence = 0;

export const subscribeToMessageNotifications = (
  conversationId: string,
  onMessageReceived: MessageReceivedHandler,
): NotificationSubscription => {
  try {
    messageChannelSequence += 1;
    let cleanupRequested = false;
    const channel = supabase
      .channel(`messages:${conversationId}:${Date.now().toString(36)}-${messageChannelSequence}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          try {
            onMessageReceived(mapRealtimeMessage(payload.new as RealtimeMessageRow));
          } catch (error) {
            console.error('[Notifications] Message callback threw:', error);
          }
        },
      );

    channel.subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Notifications] Subscribed to conversation ${conversationId}`);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        const log = cleanupRequested ? console.log : console.error;
        log(`[Notifications] Conversation ${conversationId} channel status: ${status}`, error ?? '');
      }
    });

    return () => {
      cleanupRequested = true;
      try {
        void supabase.removeChannel(channel);
      } catch (error) {
        console.error('[Notifications] Failed to remove messages channel:', error);
      }
    };
  } catch (error) {
    console.error('[Notifications] Failed to subscribe to conversation messages:', error);
    return NOOP_UNSUBSCRIBE;
  }
};

export const notificationReceivedListener = (
  onForeground?: ForegroundMessageHandler,
): NotificationSubscription => {
  const messaging = getNativeMessaging();
  if (!messaging) return NOOP_UNSUBSCRIBE;

  try {
    const messageListener = onMessage(messaging, (remoteMessage: ForegroundRemoteMessage) => {
      console.log('[Notifications] Foreground message received:', remoteMessage);

      try {
        remoteMessage.finishNotification?.();
      } catch (error) {
        console.error('[Notifications] Failed to handle foreground message:', error);
      }

      try {
        onForeground?.(remoteMessage);
      } catch (error) {
        console.error('[Notifications] Foreground message callback threw:', error);
      }
    });

    const tokenListener = onTokenRefresh(messaging, (token: string) => {
      void upsertDeviceToken(token);
    });

    return () => {
      safeUnsubscribe('foreground messages', messageListener);
      safeUnsubscribe('token refresh', tokenListener);
    };
  } catch (error) {
    console.error('[Notifications] Failed to register foreground listener:', error);
    return NOOP_UNSUBSCRIBE;
  }
};

export const useForegroundMessageListener = (onForeground?: ForegroundMessageHandler): void => {
  useEffect(() => notificationReceivedListener(onForeground), [onForeground]);
};
