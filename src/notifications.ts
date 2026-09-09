// @ts-ignore
import messaging from '@react-native-firebase/messaging';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import type { ServerChatMessage } from '@/types/messages';

export const messagingInstance = messaging;

export const requestNotificationPermission = async (): Promise<boolean> => {
  const authStatus = await messagingInstance.requestPermission();

  const enabled =
    authStatus === messagingInstance.authorizationStatus.AUTHORIZED ||
    authStatus === messagingInstance.authorizationStatus.PROVISIONAL;

  return enabled;
};

export const getFCMToken = async (): Promise<string | null> => {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) return null;

    const token = await messagingInstance.getToken({
      sync: true,
    });

    if (token) {
      // Persist token to Supabase device_tokens table
      await supabase.from('device_tokens').upsert(
        {
          user_id: currentUser.id,
          token,
          platform: Platform.OS,
        },
        { onConflict: 'user_id,platform' }
      );
    }

    return token ?? null;
  } catch (error) {
    console.error('[Notifications] Failed to get FCM token:', error);
    return null;
  }
};

export const subscribeToMessageNotifications = (
  conversationId: string,
  onMessageReceived: (message: ServerChatMessage) => void,
) => {
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
        onMessageReceived(message);

        // Show notification for new messages
        showNotification(message);
      },
    );
  return () => void supabase.removeChannel(channel);
};

const showNotification = async (message: ServerChatMessage) => {
  const notificationTitle = getNotificationTitle(message);
  const notificationBody = getNotificationBody(message);

  const token = await getFCMToken();
  if (!token) return;

  await messagingInstance.send({
    notification: {
      title: notificationTitle,
      body: notificationBody,
    },
    token,
  });
};

export const getNotificationTitle = (message: ServerChatMessage): string => {
  const attachment = message.attachment;

  if (!attachment) {
    return 'New Message';
  }

  switch (attachment.type) {
    case 'listing':
      return 'Listing Shared';
    case 'tour':
      return 'New Tour Booking';
    case 'roommate_invite':
      return 'Roommate Invite';
    case 'pod_join':
      return 'Pod Invitation';
    case 'lodge_reservation':
      return 'New Lodge Application';
    case 'lodge_decision':
      return 'Lodge Decision';
    default:
      return 'New Message';
  }
};

export const getNotificationBody = (message: ServerChatMessage): string => {
  const attachment = message.attachment;

  if (!attachment || !message.body) {
    return message.body || 'New message';
  }

  switch (attachment.type) {
    case 'listing':
      return `${attachment.title ?? 'Property'}: ${message.body?.slice(0, 50) || ''}`.trim();

    case 'tour':
      const date = attachment.date ?? '';
      const time = attachment.time ?? '';
      return `${attachment.title ?? 'Tour'}${date && time ? ` on ${date} at ${time}` : ''}`;

    case 'roommate_invite':
      return `${attachment.inviterName ?? 'Someone'} invited you${attachment.hasExistingSlot ? ' to join their slot' : ''}`;

    case 'pod_join':
      const seatInfo = `${attachment.seatNumber}/${attachment.totalSeats} seats`;
      return `${attachment.title ?? 'Pod Join'} - ${seatInfo}`;

    case 'lodge_reservation':
      return `Applied for ${attachment.title ?? 'property'}`;

    case 'lodge_decision':
      const decision = attachment.decision === 'accepted' ? 'approved' : 'rejected';
      return `Your application ${decision}${attachment.reason ? `: ${attachment.reason}` : ''}`;

    default:
      return message.body || 'New message';
  }
};

export const notificationReceivedListener = () => {
  const messageListener = messagingInstance.onMessage(
    (remoteMessage: any) => {
      console.log('[Notifications] Foreground message received:', remoteMessage);

      if (remoteMessage.notification) {
        // Handle notification tap
        remoteMessage.finishNotification();
      }
    },
  );

  return () => messageListener();
};

export const notificationOpenedListener = () => {
  const notificationOpenListener = messagingInstance.onNotificationOpenedApp(
    async (remoteMessage: any) => {
      console.log('[Notifications] App opened from notification:', remoteMessage);
    },
  );

  return () => notificationOpenListener();
};

export const getInitialNotification = async () => {
  const notification = await messagingInstance.getInitialNotification();
  return notification?.notification ?? null;
};