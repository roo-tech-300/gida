import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import {
  enableNotifications,
  getNotificationPermissionStatus,
  openSystemNotificationSettings,
  syncNotificationTokenIfGranted,
  type EnableNotificationsResult,
  type NotificationPermissionStatus,
} from '@/src/notifications';

/** Syncs an existing FCM token on launch. Never shows the OS permission prompt. */
export function useNotificationPermissionPlatform() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    void syncNotificationTokenIfGranted().catch((error: unknown) => {
      console.error('[Notifications] Failed to initialise notification token:', error);
    });
  }, []);
}

export function useNotificationPermission() {
  const [status, setStatus] = useState<NotificationPermissionStatus>('unavailable');

  const refresh = useCallback(async () => {
    const next = await getNotificationPermissionStatus();
    setStatus(next);
    return next;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const enable = useCallback(async (): Promise<EnableNotificationsResult> => {
    const result = await enableNotifications();
    setStatus(result.status);
    return result;
  }, []);

  return {
    status,
    refresh,
    enable,
    openSettings: openSystemNotificationSettings,
  };
}
