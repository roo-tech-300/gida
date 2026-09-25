import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getInitialNotification, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import { getNativeMessaging } from '@/src/notifications/native-messaging';

type ConversationPushData = { conversationId?: string };

export function NotificationNavigationListener() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const messaging = getNativeMessaging();
    if (!messaging) return;

    const openConversation = (data: ConversationPushData): void => {
      if (!data.conversationId) return;
      router.push(`/messages/${encodeURIComponent(data.conversationId)}`);
    };

    let active = true;
    void getInitialNotification(messaging)
      .then((message) => {
        if (active && message?.data) openConversation(message.data);
      })
      .catch((error: unknown) => console.error('[Notifications] Failed to read initial notification:', error));

    const unsubscribe = onNotificationOpenedApp(messaging, (message) => openConversation(message.data ?? {}));
    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  return null;
}
