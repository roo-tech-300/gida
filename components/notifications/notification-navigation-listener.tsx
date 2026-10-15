import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getInitialNotification, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import { getNativeMessaging } from '@/src/notifications/native-messaging';

type ConversationPushData = { conversationId?: string; senderId?: string };

export function NotificationNavigationListener() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const messaging = getNativeMessaging();
    if (!messaging) return;

    // The /messages/[id] route resolves `id` as the OTHER participant's user id
    // (see MessageChatScreen -> useConversationThread(otherId)), so the sender's
    // user id must be used here — passing the conversation id lands on a broken
    // thread because it is looked up as if it were a participant id.
    const openConversation = (data: ConversationPushData): void => {
      if (!data.senderId) {
        console.warn('[Notifications] Push payload missing senderId — skipping navigation', data);
        return;
      }
      router.push(`/messages/${encodeURIComponent(data.senderId)}`);
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
