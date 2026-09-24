import { Linking, Platform } from 'react-native';
import {
  getMessaging,
  getToken,
  hasPermission,
  requestPermission,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';

import {
  NOOP_UNSUBSCRIBE,
  enableNotifications,
  getFCMToken,
  getNotificationPermissionStatus,
  notificationReceivedListener,
  requestNotificationPermission,
  syncNotificationTokenIfGranted,
} from '@/src/notifications';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn(async () => ({ data: { user: null } })) },
    from: jest.fn(() => ({ upsert: jest.fn(async () => ({ error: null })) })),
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

const mockedGetMessaging = jest.mocked(getMessaging);
const mockedHasPermission = jest.mocked(hasPermission);
const mockedRequestPermission = jest.mocked(requestPermission);
const mockedGetToken = jest.mocked(getToken);
const mockedRegister = jest.mocked(registerDeviceForRemoteMessages);

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

  it('resolves unavailable from getNotificationPermissionStatus', async () => {
    await expect(getNotificationPermissionStatus()).resolves.toBe('unavailable');
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

describe('notifications on native when messaging is present', () => {
  const originalOS = Platform.OS;
  const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    mockedGetMessaging.mockReturnValue({} as never);
    mockedHasPermission.mockReset();
    mockedRequestPermission.mockReset();
    mockedGetToken.mockReset();
    mockedRegister.mockReset();
    mockedRegister.mockResolvedValue();
    mockedGetToken.mockResolvedValue('token-1');
    openSettings.mockClear();
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    mockedGetMessaging.mockImplementation(() => {
      throw new Error('messaging unavailable in tests');
    });
  });

  it('prompts then persists a token when permission is undetermined', async () => {
    mockedHasPermission.mockResolvedValue(-1);
    mockedRequestPermission.mockResolvedValue(1);

    await expect(enableNotifications()).resolves.toEqual({ enabled: true, status: 'granted' });
    expect(mockedRequestPermission).toHaveBeenCalled();
    expect(mockedGetToken).toHaveBeenCalled();
    expect(openSettings).not.toHaveBeenCalled();
  });

  it('opens system settings when permission was already denied', async () => {
    mockedHasPermission.mockResolvedValue(0);

    await expect(enableNotifications()).resolves.toEqual({ enabled: false, status: 'denied' });
    expect(mockedRequestPermission).not.toHaveBeenCalled();
    expect(openSettings).toHaveBeenCalled();
  });

  it('does not prompt when syncing an already-granted token', async () => {
    mockedHasPermission.mockResolvedValue(1);

    await syncNotificationTokenIfGranted();

    expect(mockedRequestPermission).not.toHaveBeenCalled();
    expect(mockedGetToken).toHaveBeenCalled();
  });

  it('does not prompt when permission is still undetermined during launch sync', async () => {
    mockedHasPermission.mockResolvedValue(-1);

    await syncNotificationTokenIfGranted();

    expect(mockedRequestPermission).not.toHaveBeenCalled();
    expect(mockedGetToken).not.toHaveBeenCalled();
  });
});
