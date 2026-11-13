import { useState } from 'react';
import { Platform } from 'react-native';

import type { useCustomAlert } from '@/components/ui/custom-alert';

type ShowAlert = ReturnType<typeof useCustomAlert>['showAlert'];
type Coords = { latitude: number; longitude: number };

const OK_BUTTON = [{ label: 'OK', style: 'primary' as const }];

/** Reads the device GPS position for the listing, reporting every failure through the alert. */
export function useLockLocation(onLocked: (coords: Coords) => void, showAlert: ShowAlert) {
  const [lockLoading, setLockLoading] = useState(false);

  const lockLocation = async () => {
    if (Platform.OS === 'web') {
      showAlert({
        title: 'Not Available on Web',
        message: 'GPS location locking is not available on the web version. You can manually enter coordinates or skip this step.',
        buttons: OK_BUTTON,
      });
      return;
    }
    setLockLoading(true);
    try {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert({
          title: 'Permission Denied',
          message: 'Location permission is required to lock your property coordinates.',
          buttons: OK_BUTTON,
        });
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      onLocked({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch (error: unknown) {
      console.error('[LockLocation] Failed to read device location:', error);
      showAlert({
        title: 'Error',
        message: 'Could not fetch your location. Make sure GPS is enabled.',
        buttons: OK_BUTTON,
      });
    } finally {
      setLockLoading(false);
    }
  };

  return { lockLocation, lockLoading };
}
