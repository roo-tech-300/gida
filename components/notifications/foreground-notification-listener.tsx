import { useCallback } from 'react';
import { useForegroundMessageListener, type ForegroundRemoteMessage } from '@/src/notifications';
import { useAppToast } from '@/components/ui/toast-card';

/**
 * Listens for FCM push notifications arriving while the app is in the foreground
 * and surfaces them immediately as an in-app toast notification.
 */
export function ForegroundNotificationListener() {
  const { showToast } = useAppToast();

  const handleForegroundMessage = useCallback(
    (remoteMessage: ForegroundRemoteMessage) => {
      const title = remoteMessage.notification?.title?.trim() || 'New Notification';
      const body = remoteMessage.notification?.body?.trim() || 'You have a new notification.';

      showToast({
        title,
        message: body,
        type: 'info',
      });
    },
    [showToast],
  );

  useForegroundMessageListener(handleForegroundMessage);

  return null;
}
