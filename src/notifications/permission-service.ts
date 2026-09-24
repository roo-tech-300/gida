import { Linking } from 'react-native';
import { hasPermission, requestPermission } from '@react-native-firebase/messaging';
import { getNativeMessaging, mapAuthStatus } from './native-messaging';
import { persistCurrentToken } from './token-service';
import type { EnableNotificationsResult, NotificationPermissionStatus } from './types';

export const getNotificationPermissionStatus = async (): Promise<NotificationPermissionStatus> => {
  const messaging = getNativeMessaging();
  if (!messaging) return 'unavailable';

  try {
    return mapAuthStatus(await hasPermission(messaging));
  } catch (error) {
    console.error('[Notifications] Failed to read permission status:', error);
    return 'unavailable';
  }
};

export const openSystemNotificationSettings = (): void => {
  void Linking.openSettings().catch((error: unknown) => {
    console.error('[Notifications] Failed to open system settings:', error);
  });
};

/**
 * Prompts only when the OS still allows it. If the user already denied, opens
 * system settings so they can turn notifications back on.
 */
export const enableNotifications = async (): Promise<EnableNotificationsResult> => {
  const messaging = getNativeMessaging();
  if (!messaging) {
    return { enabled: false, status: 'unavailable' };
  }

  try {
    let status = mapAuthStatus(await hasPermission(messaging));

    if (status === 'denied') {
      openSystemNotificationSettings();
      return { enabled: false, status };
    }

    if (status !== 'granted') {
      status = mapAuthStatus(await requestPermission(messaging));
    }

    if (status !== 'granted') {
      return { enabled: false, status };
    }

    await persistCurrentToken(messaging);
    return { enabled: true, status: 'granted' };
  } catch (error) {
    console.error('[Notifications] Failed to enable notifications:', error);
    return { enabled: false, status: 'unavailable' };
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  const result = await enableNotifications();
  return result.enabled;
};
