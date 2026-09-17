import { useEffect } from 'react';
import { Platform } from 'react-native';
import { requestNotificationPermission } from '@/src/notifications';

export function useNotificationPermissionPlatform() {
  useEffect(() => {
    const init = async () => {
      try {
        // Only request permission on native platforms (iOS/Android).
        // On web, skip RN Firebase notification permission and let the app
        // handle browser notifications separately if needed.
        if (Platform.OS === 'web') {
          console.log('[Notifications] Skipping RN permission on web — use browser API');
          return;
        }
        await requestNotificationPermission();
      } catch (error) {
        // Notifications are best-effort: never let them break app startup.
        console.error('[Notifications] Failed to initialise notification permission:', error);
      }
    };

    void init();
  }, []);
}