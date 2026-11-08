import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getInitialNotification, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import { getNativeMessaging } from '@/src/notifications/native-messaging';
import { setPendingPushNavigation } from '@/src/notifications/pending-navigation';

// Accept camelCase, snake_case, and alternate keys from FCM payloads
type RawPushData = Record<string, string | undefined>;

function extractSenderId(data: RawPushData): string | null {
  return data.senderId ?? data.sender_id ?? data.sender ?? null;
}

function extractListingId(data: RawPushData): string | null {
  return (
    data.listingId ??
    data.listing_id ??
    data.propertyId ??
    data.property_id ??
    (data.type === 'apartment_match' ? data.id : undefined) ??
    null
  );
}

function buildNotificationPath(data: RawPushData): string | null {
  const listingId = extractListingId(data);
  if (listingId || data.type === 'apartment_match') {
    if (!listingId) {
      console.warn('[Notifications] Match alert push missing listingId', data);
      return null;
    }
    return `/property/${encodeURIComponent(listingId)}`;
  }

  const senderId = extractSenderId(data);
  if (!senderId) {
    console.warn('[Notifications] Push payload missing target destination', data);
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
    // Store it so AuthGate consumes it once auth is settled.
    void getInitialNotification(messaging)
      .then((message) => {
        if (!active || !message?.data) return;
        const path = buildNotificationPath(message.data as RawPushData);
        if (path) {
          console.log('[Notifications] Cold-start push — deferring navigation to', path);
          setPendingPushNavigation(path);
        }
      })
      .catch((error: unknown) =>
        console.error('[Notifications] Failed to read initial notification:', error),
      );

    // Background-to-foreground tap: app was backgrounded, user tapped the notification.
    const unsubscribe = onNotificationOpenedApp(messaging, (message) => {
      const path = buildNotificationPath((message.data ?? {}) as RawPushData);
      if (!path) return;
      console.log('[Notifications] Background-tap push — navigating to', path);
      setTimeout(() => {
        try {
          router.push(path as never);
        } catch (error: unknown) {
          console.error('[Notifications] Background-tap navigation failed:', error);
        }
      }, 50);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  return null;
}
