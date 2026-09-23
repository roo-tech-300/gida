import { useEffect } from 'react';
import { onMessage, onTokenRefresh } from '@react-native-firebase/messaging';
import { supabase } from '@/lib/supabase';
import type { ServerChatMessage } from '@/types/messages';
import { getNativeMessaging } from './native-messaging';
import { upsertDeviceToken } from './token-service';
import {
  NOOP_UNSUBSCRIBE,
  type ForegroundMessageHandler,
  type ForegroundRemoteMessage,
  type MessageReceivedHandler,
  type NotificationSubscription,
} from './types';

const safeUnsubscribe = (label: string, unsubscribe: NotificationSubscription | undefined): void => {
  try {
    unsubscribe?.();
  } catch (error) {
    console.error(`[Notifications] Failed to unsubscribe from ${label}:`, error);
  }
};

export const subscribeToMessageNotifications = (
  conversationId: string,
  onMessageReceived: MessageReceivedHandler,
): NotificationSubscription => {
  try {
    const channel = supabase
      .channel(`messages:${conversationId}`)
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
            onMessageReceived(payload.new as ServerChatMessage);
          } catch (error) {
            console.error('[Notifications] Message callback threw:', error);
          }
        },
      );

    return () => {
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
