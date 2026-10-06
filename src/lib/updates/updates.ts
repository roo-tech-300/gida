import { Platform } from 'react-native';
import * as Updates from 'expo-updates';

export type UpdateCheckResult = 'updated' | 'current' | 'unavailable';

export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  if (Platform.OS === 'web' || __DEV__ || !Updates.isEnabled) return 'unavailable';

  try {
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) return 'current';

    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return 'updated';
  } catch (error) {
    console.error('[AppUpdates] Failed to check or apply update:', error);
    return 'unavailable';
  }
}
