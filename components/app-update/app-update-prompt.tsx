import { useCallback } from 'react';
import { Linking } from 'react-native';

import { useAppToast } from '@/components/ui/toast-card';
import { useAppUpdateStatus } from '@/hooks/use-app-update-status';
import { UpdateAvailableSheet } from './update-available-sheet';
import { UpdateRequiredScreen } from './update-required-screen';

/**
 * Offers new APKs on Android (see docs/RELEASING.md). Mounted once in the root
 * layout; renders nothing unless the newest release on this app's track is a
 * newer version.
 */
export function AppUpdatePrompt() {
  const { status, installedVersion, snoozeOffer } = useAppUpdateStatus();
  const { showToast } = useAppToast();
  const apkUrl = status.kind === 'none' ? null : status.release.apkUrl;

  const download = useCallback(async () => {
    if (!apkUrl) return;
    try {
      await Linking.openURL(apkUrl);
    } catch (error) {
      console.error('[AppUpdates] Could not open the APK download:', error);
      showToast({ message: 'Could not open the download. Visit gida.apartments to get the latest app.', type: 'error' });
    }
  }, [apkUrl, showToast]);

  if (status.kind === 'none' || !installedVersion) return null;

  if (status.kind === 'required') {
    return <UpdateRequiredScreen release={status.release} installedVersion={installedVersion} onDownload={download} />;
  }

  return (
    <UpdateAvailableSheet
      release={status.release}
      installedVersion={installedVersion}
      onDownload={() => {
        // Don't re-offer while they're installing; a newer release still shows.
        snoozeOffer();
        void download();
      }}
      onLater={snoozeOffer}
    />
  );
}
