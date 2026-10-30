import type { AppRelease, AppUpdateStatus } from '@/types/app-release';
import { compareVersions, isValidVersion } from '@/utils/version-compare';

export const UPDATE_SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

export interface UpdateSnooze {
  version: string;
  until: number;
}

/**
 * Versions, not build numbers: the installed version is the OTA runtime
 * version baked into the APK, so it stays accurate after OTA updates. Builds
 * of the same version get new JavaScript over the air and need no prompt.
 */
export function getAppUpdateStatus(installedVersion: string, latest: AppRelease | null): AppUpdateStatus {
  if (!latest || !isValidVersion(installedVersion) || !isValidVersion(latest.versionName)) return { kind: 'none' };

  const minimum = latest.minSupportedVersion;
  if (isValidVersion(minimum) && compareVersions(installedVersion, minimum) < 0) {
    return { kind: 'required', release: latest };
  }
  if (compareVersions(latest.versionName, installedVersion) > 0) {
    return { kind: 'available', release: latest };
  }
  return { kind: 'none' };
}

/** "Later" hides the offer for this version only; a newer release shows again. */
export function isSnoozed(snooze: UpdateSnooze | null, release: AppRelease, now: number): boolean {
  return !!snooze && snooze.version === release.versionName && snooze.until > now;
}
