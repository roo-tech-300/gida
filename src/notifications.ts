// @ts-ignore
import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { getNotificationBody, getNotificationTitle } from '@/src/notification-copy';
import { supabase } from '@/lib/supabase';
import type { ServerChatMessage } from '@/types/messages';

export const messagingInstance = messaging;

/**
 * Notifications are strictly best-effort. Web, Expo Go and builds without the
 * native Firebase module must degrade to silent no-ops instead of throwing into
 * UI code. Every export below follows the same contract:
 *   - never throws
 *   - always returns a callable cleanup handle
 *   - logs failures under a `[Notifications]` context instead of failing silently
 */
const isMessagingAvailable = (): boolean =>
  Platform.OS !== 'web' && typeof messagingInstance !== 'undefined';

/** Callable no-op cleanup so callers can always invoke the returned unsubscribe. */
export const NOOP_UNSUBSCRIBE = (): void => {};

export type NotificationSubscription = () => void;

export type ForegroundRemoteMessage = {
  notification?: { title?: string | null; body?: string | null } | null;
  finishNotification?: () => void;
};

const safeUnsubscribe = (
  label: string,
  unsubscribe: NotificationSubscription | undefined,
): void => {
  try {
    unsubscribe?.();
  } catch (error) {
    console.error(`[Notifications] Failed to unsubscribe from ${label}:`, error);
  }
};

const upsertDeviceToken = async (token: string): Promise<void> => {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) return;

    await supabase.from('device_tokens').upsert(
      {
        user_id: currentUser.id,
        token,
        platform: Platform.OS,
      },
      { onConflict: 'user_id,platform' }
    );
  } catch (error) {
    console.error('[Notifications] Failed to persist device token:', error);
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isMessagingAvailable()) {
    console.log('[Notifications] Skipping permission request — messaging unavailable here');
    return false;
  }

  try {
    const authStatus = await messagingInstance.requestPermission();

    const enabled =
      authStatus === messagingInstance.authorizationStatus.AUTHORIZED ||
      authStatus === messagingInstance.authorizationStatus.PROVISIONAL;

    if (!enabled) return false;

    const token = await messagingInstance.getToken({ sync: true });
    if (token) await upsertDeviceToken(token);

    return true;
  } catch (error) {
    console.error('[Notifications] Failed to request notification permission:', error);
    return false;
  }
};

export const getFCMToken = async (): Promise<string | null> => {
  if (!isMessagingAvailable()) {
    console.log('[Notifications] Skipping FCM token — messaging unavailable here');
    return null;
  }

  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) return null;

    const token = await messagingInstance.getToken({ sync: true });
    if (token) await upsertDeviceToken(token);

    return token ?? null;
  } catch (error) {
    console.error('[Notifications] Failed to get FCM token:', error);
    return null;
  }
};

/**
 * Best-effort push for an inbound message. Swallows everything on purpose: a
 * failed notification must never break the chat feed.
 */
const showNotification = async (message: ServerChatMessage): Promise<void> => {
  if (!isMessagingAvailable() || typeof messagingInstance.send !== 'function') return;

  try {
    const token = await getFCMToken();
    if (!token) return;

    await messagingInstance.send({
      notification: {
        title: getNotificationTitle(message),
        body: getNotificationBody(message),
      },
      token,
    });
  } catch (error) {
    console.error('[Notifications] Failed to send message notification:', error);
  }
};

/**
 * Subscribes to new messages in a conversation and mirrors them into a push
 * notification. Always returns a callable unsubscribe — even when subscribing
 * failed — so callers never need their own guards.
 */
export const subscribeToMessageNotifications = (
  conversationId: string,
  onMessageReceived: (message: ServerChatMessage) => void,
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
          const message = payload.new as ServerChatMessage;

          try {
            onMessageReceived(message);
          } catch (error) {
            console.error('[Notifications] Message callback threw:', error);
          }

          void showNotification(message).catch((error: unknown) => {
            console.error('[Notifications] Notification dispatch failed:', error);
          });
        }
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

/** Imperative foreground listener, reused by `useForegroundMessageListener`. */
export const notificationReceivedListener = (): NotificationSubscription => {
  if (!isMessagingAvailable()) return NOOP_UNSUBSCRIBE;

  try {
    const messageListener = messagingInstance.onMessage(
      (remoteMessage: ForegroundRemoteMessage) => {
        console.log('[Notifications] Foreground message received:', remoteMessage);

        try {
          remoteMessage.finishNotification?.();
        } catch (error) {
          console.error('[Notifications] Failed to handle foreground message:', error);
        }
      }
    );

    return () => safeUnsubscribe('foreground messages', messageListener);
  } catch (error) {
    console.error('[Notifications] Failed to register foreground listener:', error);
    return NOOP_UNSUBSCRIBE;
  }
};

/**
 * Registers the global foreground FCM subscription. This is a hook, so it must
 * be called at the top level of a component (`app/_layout.tsx`) — never from
 * inside an effect or callback, which throws an "Invalid hook call" error.
 */
export const useForegroundMessageListener = (): void => {
  useEffect(() => notificationReceivedListener(), []);
};
