import { Platform } from 'react-native';
import * as Updates from 'expo-updates';

export type UpdateCheckResult = 'updated' | 'current' | 'unavailable';

const UPDATE_LOG_TAG = '[AppUpdates]';

function formatError(error: unknown): string {
  return error instanceof Error ? error.stack ?? error.message : String(error);
}

export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  if (Platform.OS === 'web') {
    console.info(`${UPDATE_LOG_TAG} Skipping update check on web.`);
    return 'unavailable';
  }

  if (__DEV__) {
    console.info(`${UPDATE_LOG_TAG} Skipping update check in development mode.`);
    return 'unavailable';
  }

  if (!Updates.isEnabled) {
    console.warn(`${UPDATE_LOG_TAG} Updates are disabled in this build.`, {
      updateUrl: Updates.manifest?.extra?.expoClient?.updates?.url ?? 'unknown',
      channel: Updates.channel,
      runtimeVersion: Updates.runtimeVersion,
      updateId: Updates.updateId,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      isEmergencyLaunch: Updates.isEmergencyLaunch,
      emergencyLaunchReason: Updates.emergencyLaunchReason,
    });
    return 'unavailable';
  }

  try {
    console.info(`${UPDATE_LOG_TAG} Checking for updates...`, {
      updateUrl: Updates.manifest?.extra?.expoClient?.updates?.url ?? 'unknown',
      channel: Updates.channel,
      runtimeVersion: Updates.runtimeVersion,
      updateId: Updates.updateId,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      isEmergencyLaunch: Updates.isEmergencyLaunch,
      emergencyLaunchReason: Updates.emergencyLaunchReason,
    });
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) {
      console.info(`${UPDATE_LOG_TAG} Update not found; this build is up to date.`);
      return 'current';
    }

    console.info(`${UPDATE_LOG_TAG} Update found; downloading update...`);
    const download = await Updates.fetchUpdateAsync();
    if (!download.isNew) {
      console.info(`${UPDATE_LOG_TAG} Download completed, but no new update was installed.`);
      return 'current';
    }

    console.info(`${UPDATE_LOG_TAG} Applying update by reloading the app...`);
    await Updates.reloadAsync();
    return 'updated';
  } catch (error) {
    console.error(`${UPDATE_LOG_TAG} Failed to check or apply update: ${formatError(error)}`);
    try {
      const entries = await Updates.readLogEntriesAsync(60 * 60 * 1000);
      for (const entry of entries.slice(-20)) {
        console.error(`${UPDATE_LOG_TAG} Expo Updates log: ${JSON.stringify(entry)}`);
      }
    } catch (logError) {
      console.error(`${UPDATE_LOG_TAG} Failed to read Expo Updates logs: ${formatError(logError)}`);
    }
    return 'unavailable';
  }
}
