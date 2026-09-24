/**
 * Notifications module entry point.
 * All functions degrade gracefully to safe no-ops on web, Expo Go,
 * or builds where the native Firebase messaging module is unavailable.
 */

export * from './notifications/types';
export {
  getNotificationPermissionStatus,
  openSystemNotificationSettings,
  enableNotifications,
  requestNotificationPermission,
} from './notifications/permission-service';

export {
  upsertDeviceToken,
  persistCurrentToken,
  syncNotificationTokenIfGranted,
  getFCMToken,
} from './notifications/token-service';

export {
  subscribeToMessageNotifications,
  notificationReceivedListener,
  useForegroundMessageListener,
} from './notifications/listener-service';
