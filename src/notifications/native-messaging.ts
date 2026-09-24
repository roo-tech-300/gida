import { Platform } from 'react-native';
import {
  AuthorizationStatus,
  getMessaging,
  type Messaging,
} from '@react-native-firebase/messaging';
import type { NotificationPermissionStatus } from './types';

const GRANTED_STATUSES = new Set<number>([
  AuthorizationStatus.AUTHORIZED,
  AuthorizationStatus.PROVISIONAL,
  AuthorizationStatus.EPHEMERAL,
]);

export const getNativeMessaging = (): Messaging | null => {
  if (Platform.OS === 'web') return null;

  try {
    return getMessaging();
  } catch (error) {
    console.error('[Notifications] Messaging module unavailable:', error);
    return null;
  }
};

export const mapAuthStatus = (authStatus: number): NotificationPermissionStatus => {
  if (GRANTED_STATUSES.has(authStatus)) return 'granted';
  if (authStatus === AuthorizationStatus.DENIED) return 'denied';
  return 'undetermined';
};
