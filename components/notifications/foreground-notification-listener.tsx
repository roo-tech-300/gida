import { useCallback } from 'react';
import { useForegroundMessageListener, type ForegroundRemoteMessage } from '@/src/notifications';
import { useAppToast } from '@/components/ui/toast-card';
import { useRouter } from 'expo-router';

/**
 * Listens for FCM push notifications arriving while the app is in the
 * foreground and surfaces them as an in-app toast. When the toast is tapped,
 * it navigates directly to the conversation.
 */
export function ForegroundNotificationListener() {
  const { showToast } = useAppToast();
  const router = useRouter();

  const handleForegroundMessage = useCallback(
    (remoteMessage: ForegroundRemoteMessage) => {
      const title = remoteMessage.notification?.title?.trim() || 'New Message';
      const body  = remoteMessage.notification?.body?.trim()  || 'You have a new message.';

      const data = remoteMessage.data ?? {};
      const senderId = data.senderId ?? data.sender_id ?? null;

      showToast({
        title,
        message: body,
        type: 'info',
        onPress: senderId
          ? () => {
              try {
                router.push(`/messages/${encodeURIComponent(senderId)}` as never);
              } catch (error) {
                console.error('[Notifications] Foreground toast navigation failed:', error);
              }
            }
          : undefined,
      });
    },
    [showToast, router],
  );

  useForegroundMessageListener(handleForegroundMessage);

  return null;
}
