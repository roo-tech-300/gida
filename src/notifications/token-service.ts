import { Platform } from 'react-native';
import {
  getToken,
  registerDeviceForRemoteMessages,
  type Messaging,
} from '@react-native-firebase/messaging';
import { supabase } from '@/lib/supabase';
import { getNativeMessaging, mapAuthStatus } from './native-messaging';
import { hasPermission } from '@react-native-firebase/messaging';

export const upsertDeviceToken = async (token: string): Promise<void> => {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) return;

    await supabase.from('device_tokens').upsert(
      {
        user_id: currentUser.id,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform' },
    );
  } catch (error) {
    console.error('[Notifications] Failed to persist device token:', error);
  }
};

export const persistCurrentToken = async (messaging: Messaging): Promise<string | null> => {
  try {
    await registerDeviceForRemoteMessages(messaging);
  } catch (error) {
    console.error('[Notifications] Failed to register for remote messages:', error);
  }

  try {
    const token = await getToken(messaging);
    if (token) await upsertDeviceToken(token);
    return token ?? null;
  } catch (error) {
    console.error('[Notifications] Failed to get FCM token:', error);
    return null;
  }
};

/** Registers an FCM token only if the user already granted permission. Never prompts. */
export const syncNotificationTokenIfGranted = async (): Promise<void> => {
  const messaging = getNativeMessaging();
  if (!messaging) return;

  try {
    const status = mapAuthStatus(await hasPermission(messaging));
    if (status !== 'granted') return;
    await persistCurrentToken(messaging);
  } catch (error) {
    console.error('[Notifications] Failed to sync notification token:', error);
  }
};

export const getFCMToken = async (): Promise<string | null> => {
  const messaging = getNativeMessaging();
  if (!messaging) {
    console.log('[Notifications] Skipping FCM token — messaging unavailable here');
    return null;
  }

  return persistCurrentToken(messaging);
};
