import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getInitialNotification, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import { getNativeMessaging } from '@/src/notifications/native-messaging';
import { setPendingPushNavigation } from '@/src/notifications/pending-navigation';

// Accept both camelCase (our Edge Function) and snake_case (fallback / legacy)
type RawPushData = Record<string, string | undefined>;

function extractSenderId(data: RawPushData): string | null {
  return data.senderId ?? data.sender_id ?? data.sender ?? null;
}

function buildMessagePath(data: RawPushData): string | null {
  const senderId = extractSenderId(data);
  if (!senderId) {
    console.warn('[Notifications] Push payload missing senderId — cannot navigate to conversation', data);
    return null;
  }
  return `/messages/${encodeURIComponent(senderId)}`;
}

export function NotificationNavigationListener() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const messaging = getNativeMessaging();
    if (!messaging) return;

    let active = true;

    // Cold-start / killed-app tap: the notification that launched the app.
    // We CANNOT call router.push() here because AuthGate hasn't resolved yet
    // and will overwrite the navigation. Store it — AuthGate consumes it once
    // auth is settled (single consumer, no timeout race).
    void getInitialNotification(messaging)
      .then((message) => {
        if (!active || !message?.data) return;
        const path = buildMessagePath(message.data as RawPushData);
        if (path) {
          console.log('[Notifications] Cold-start push — deferring navigation to', path);
          setPendingPushNavigation(path);
        }
      })
      .catch((error: unknown) =>
        console.error('[Notifications] Failed to read initial notification:', error),
      );

    // Background-to-foreground tap: app was backgrounded, user tapped the
    // notification. Auth is already settled here, so navigate immediately.
    const unsubscribe = onNotificationOpenedApp(messaging, (message) => {
      const path = buildMessagePath((message.data ?? {}) as RawPushData);
      if (!path) return;
      console.log('[Notifications] Background-tap push — navigating to', path);
      try {
        router.push(path as never);
      } catch (error) {
        console.error('[Notifications] Background-tap navigation failed:', error);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  return null;
}
