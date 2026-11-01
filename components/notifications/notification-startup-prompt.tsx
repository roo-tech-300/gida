import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { CustomAlert, useCustomAlert } from '@/components/ui/custom-alert';
import {
  enableNotifications,
  getNotificationPermissionStatus,
  openSystemNotificationSettings,
  syncNotificationTokenIfGranted,
} from '@/src/notifications';

export function NotificationStartupPrompt({ enabled }: { enabled: boolean }) {
  const { visible, title, message, buttons, showAlert, hideAlert } = useCustomAlert();
  const isPromptOpen = useRef(false);
  const hadPermission = useRef(false);

  const dismissPrompt = useCallback(() => {
    isPromptOpen.current = false;
    hideAlert();
  }, [hideAlert]);

  const enable = useCallback(async () => {
    try {
      const result = await enableNotifications();
      if (result.enabled) hadPermission.current = true;
    } catch (error) {
      console.error('[NotificationPrompt] Failed to request notification permission:', error);
    }
  }, []);

  const checkAndPrompt = useCallback(async () => {
    if (!enabled || Platform.OS === 'web') return;
    try {
      const next = await getNotificationPermissionStatus();
      if (next === 'granted') {
        isPromptOpen.current = false;
        hideAlert();
        if (!hadPermission.current) await syncNotificationTokenIfGranted();
        hadPermission.current = true;
        return;
      }
      hadPermission.current = false;
      if (next === 'unavailable' || isPromptOpen.current) return;

      isPromptOpen.current = true;
      const denied = next === 'denied';
      showAlert({
        title: 'Stay in the loop',
        message: denied
          ? 'Notifications are turned off. Open your device settings to allow Gida notifications and get important updates.'
          : 'Turn on notifications so you don’t miss replies, updates, and important news from Gida.',
        buttons: denied
          ? [
              { label: 'Not now', style: 'cancel' },
              { label: 'Open Settings', style: 'primary', onPress: openSystemNotificationSettings },
            ]
          : [
              { label: 'Not now', style: 'cancel' },
              { label: 'Settings', style: 'cancel', onPress: openSystemNotificationSettings },
              { label: 'Enable', style: 'primary', onPress: () => void enable() },
            ],
      });
    } catch (error) {
      console.error('[NotificationPrompt] Failed to check notification permission:', error);
    }
  }, [enable, enabled, hideAlert, showAlert]);

  useEffect(() => {
    void checkAndPrompt();
  }, [checkAndPrompt]);

  useEffect(() => {
    let wasActive = AppState.currentState === 'active';
    const subscription = AppState.addEventListener('change', (nextState) => {
      const isActive = nextState === 'active';
      if (isActive && !wasActive) void checkAndPrompt();
      wasActive = isActive;
    });
    return () => subscription.remove();
  }, [checkAndPrompt]);

  if (!enabled || Platform.OS === 'web') return null;
  return <CustomAlert visible={visible} title={title} message={message} buttons={buttons} onDismiss={dismissPrompt} />;
}
