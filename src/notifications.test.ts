import { Platform } from 'react-native';

import {
  NOOP_UNSUBSCRIBE,
  getFCMToken,
  notificationReceivedListener,
  requestNotificationPermission,
} from '@/src/notifications';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn(async () => ({ data: { user: null } })) },
    from: jest.fn(() => ({ upsert: jest.fn(async () => ({ error: null })) })),
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

/**
 * Notifications are strictly best-effort: on web, in Expo Go, or in any build
 * without the native Firebase module, every export must degrade to a safe no-op
 * instead of throwing into UI code.
 */
describe('notifications fail gracefully when messaging is unavailable', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  });

  it('resolves false from requestNotificationPermission', async () => {
    await expect(requestNotificationPermission()).resolves.toBe(false);
  });

  it('resolves null from getFCMToken', async () => {
    await expect(getFCMToken()).resolves.toBeNull();
  });

  it('returns a callable, non-throwing unsubscribe for the foreground listener', () => {
    const unsubscribe = notificationReceivedListener();

    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });

  it('exposes a no-op unsubscribe helper for callers that always clean up', () => {
    expect(() => NOOP_UNSUBSCRIBE()).not.toThrow();
  });
});
