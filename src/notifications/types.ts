import type { ServerChatMessage } from '@/types/messages';

export type NotificationPermissionStatus = 'unavailable' | 'undetermined' | 'denied' | 'granted';

export type EnableNotificationsResult = {
  enabled: boolean;
  status: NotificationPermissionStatus;
};

export type NotificationSubscription = () => void;

/** Callable no-op cleanup so callers can always invoke the returned unsubscribe. */
export const NOOP_UNSUBSCRIBE: NotificationSubscription = (): void => {};

export type ForegroundRemoteMessage = {
  notification?: { title?: string | null; body?: string | null } | null;
  finishNotification?: () => void;
};

export type MessageReceivedHandler = (message: ServerChatMessage) => void;
export type ForegroundMessageHandler = (message: ForegroundRemoteMessage) => void;
