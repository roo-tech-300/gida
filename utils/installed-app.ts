import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import type { ReleaseTrack } from '@/types/app-release';

export interface InstalledApp {
  track: ReleaseTrack;
  /** OTA runtime version (= app.json "version") baked into the installed APK. */
  version: string;
}

/**
 * Both values come from the APK itself, so they stay correct after OTA
 * updates and work on APKs released before this code existed. Returns null
 * where update prompts don't apply: web, dev builds, and the `tester`
 * channel (debug APKs from the dev branch).
 */
export function getInstalledApp(): InstalledApp | null {
  if (Platform.OS !== 'android' || __DEV__ || !Updates.isEnabled) return null;
  const { channel, runtimeVersion } = Updates;
  if ((channel !== 'production' && channel !== 'preview') || !runtimeVersion) return null;
  return { track: channel, version: runtimeVersion };
}
