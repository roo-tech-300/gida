import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui/toast-card';
import { MOCK_PRODUCTION_RELEASE, MOCK_REQUIRED_RELEASE } from '@/dummy/app-release-mock';
import { useAppUpdateStatus } from '@/hooks/use-app-update-status';
import type { AppUpdateStatus } from '@/types/app-release';
import { AppUpdatePrompt } from './app-update-prompt';

jest.mock('@/hooks/use-app-update-status', () => ({ useAppUpdateStatus: jest.fn() }));

const mockedHook = useAppUpdateStatus as jest.MockedFunction<typeof useAppUpdateStatus>;
const snoozeOffer = jest.fn();

const SAFE_AREA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderWith(status: AppUpdateStatus) {
  mockedHook.mockReturnValue({ status, installedVersion: '1.0.0', snoozeOffer });
  await render(
    <SafeAreaProvider initialMetrics={SAFE_AREA}>
      <ToastProvider>
        <AppUpdatePrompt />
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

describe('AppUpdatePrompt', () => {
  let openURL: jest.SpyInstance;

  beforeEach(() => {
    snoozeOffer.mockClear();
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => openURL.mockRestore());

  it('renders nothing when the app is up to date', async () => {
    await renderWith({ kind: 'none' });
    expect(screen.queryByText('Update available')).toBeNull();
    expect(screen.queryByText('Update required')).toBeNull();
  });

  it('offers an optional update that can be put off', async () => {
    await renderWith({ kind: 'available', release: MOCK_PRODUCTION_RELEASE });
    expect(screen.getByText('Update available')).toBeTruthy();
    expect(screen.getByText('Gida 1.1.0 is ready · you have 1.0.0')).toBeTruthy();
    expect(screen.getByText('Walkthrough videos on listings.')).toBeTruthy();

    fireEvent.press(screen.getByText('Later'));
    expect(snoozeOffer).toHaveBeenCalledTimes(1);
    expect(openURL).not.toHaveBeenCalled();
  });

  it('downloads the APK and stops re-offering it', async () => {
    await renderWith({ kind: 'available', release: MOCK_PRODUCTION_RELEASE });
    fireEvent.press(screen.getByText('Download update'));
    expect(openURL).toHaveBeenCalledWith(MOCK_PRODUCTION_RELEASE.apkUrl);
    expect(snoozeOffer).toHaveBeenCalledTimes(1);
  });

  it('blocks unsupported versions with no way to dismiss', async () => {
    await renderWith({ kind: 'required', release: MOCK_REQUIRED_RELEASE });
    expect(screen.getByText('Update required')).toBeTruthy();
    expect(screen.queryByText('Later')).toBeNull();

    fireEvent.press(screen.getByText('Download Gida 1.1.0'));
    expect(openURL).toHaveBeenCalledWith(MOCK_REQUIRED_RELEASE.apkUrl);
    expect(snoozeOffer).not.toHaveBeenCalled();
  });
});
