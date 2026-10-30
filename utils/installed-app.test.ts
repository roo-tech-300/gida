import { Platform } from 'react-native';

import { getInstalledApp } from '@/utils/installed-app';

type UpdatesMock = { isEnabled: boolean; channel: string | null; runtimeVersion: string | null };

// __esModule keeps `import * as Updates` pointing at this object, so tests can change it.
jest.mock('expo-updates', () => ({ __esModule: true, isEnabled: true, channel: 'production', runtimeVersion: '1.0.0' }));
const mockUpdates = jest.requireMock<UpdatesMock>('expo-updates');

// __DEV__ is a declared global constant; tests need to flip it.
function setDev(value: boolean): void {
  (globalThis as unknown as { __DEV__: boolean }).__DEV__ = value;
}

describe('getInstalledApp', () => {
  const originalOS = Platform.OS;
  const originalDev = __DEV__;

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    setDev(false);
    Object.assign(mockUpdates, { isEnabled: true, channel: 'production', runtimeVersion: '1.0.0' });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    setDev(originalDev);
  });

  it('reads track and version from the installed APK', () => {
    expect(getInstalledApp()).toEqual({ track: 'production', version: '1.0.0' });
    mockUpdates.channel = 'preview';
    expect(getInstalledApp()).toEqual({ track: 'preview', version: '1.0.0' });
  });

  it('skips dev-branch tester APKs, dev mode, web and builds without updates', () => {
    mockUpdates.channel = 'tester';
    expect(getInstalledApp()).toBeNull();
    mockUpdates.channel = 'production';

    setDev(true);
    expect(getInstalledApp()).toBeNull();
    setDev(false);

    mockUpdates.isEnabled = false;
    expect(getInstalledApp()).toBeNull();
    mockUpdates.isEnabled = true;

    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    expect(getInstalledApp()).toBeNull();
  });
});
