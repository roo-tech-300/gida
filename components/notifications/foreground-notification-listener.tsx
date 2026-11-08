import { useCallback } from 'react';
import { useForegroundMessageListener, type ForegroundRemoteMessage } from '@/src/notifications';
import { useAppToast } from '@/components/ui/toast-card';
import { useRouter } from 'expo-router';

/**
 * Listens for FCM push notifications arriving while the app is in the
 * foreground and surfaces them as an in-app toast. When tapped, it navigates
 * directly to the relevant property or conversation.
 */
export function ForegroundNotificationListener() {
  const { showToast } = useAppToast();
  const router = useRouter();

  const handleForegroundMessage = useCallback(
    (remoteMessage: ForegroundRemoteMessage) => {
      const data = (remoteMessage.data ?? {}) as Record<string, string | undefined>;
      const listingId =
        data.listingId ??
        data.listing_id ??
        data.propertyId ??
        data.property_id ??
        (data.type === 'apartment_match' ? data.id : undefined) ??
        null;
      const senderId = data.senderId ?? data.sender_id ?? null;

      const fallbackTitle = listingId ? 'We just found you a lodge' : 'New Message';
      const fallbackBody = listingId
        ? 'We found a lodge check it out'
        : 'You have a new message.';

      const title = remoteMessage.notification?.title?.trim() || fallbackTitle;
      const body = remoteMessage.notification?.body?.trim() || fallbackBody;

      const destination = listingId
        ? `/property/${encodeURIComponent(listingId)}`
        : senderId
        ? `/messages/${encodeURIComponent(senderId)}`
        : null;

      showToast({
        title,
        message: body,
        type: 'info',
        onPress: destination
          ? () => {
              try {
                router.push(destination as never);
              } catch (error: unknown) {
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
