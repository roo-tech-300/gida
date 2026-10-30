import type { AppRelease, ReleaseTrack } from '@/types/app-release';

const TRACKS: readonly ReleaseTrack[] = ['production', 'preview'];

interface DbAppRelease {
  track: ReleaseTrack;
  version_name: string;
  build_number: number;
  apk_url: string;
  release_notes: string | null;
  min_supported_version: string | null;
  published_at: string;
}

function isDbAppRelease(value: unknown): value is DbAppRelease {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    TRACKS.includes(row.track as ReleaseTrack) &&
    typeof row.version_name === 'string' &&
    typeof row.build_number === 'number' &&
    typeof row.apk_url === 'string' &&
    row.apk_url.startsWith('https://')
  );
}

/** Returns null (and logs) for rows the prompt can't safely use. */
export function parseAppRelease(value: unknown): AppRelease | null {
  if (!isDbAppRelease(value)) {
    console.error('[AppUpdates] Ignoring malformed app_releases row:', value);
    return null;
  }
  return {
    track: value.track,
    versionName: value.version_name,
    buildNumber: value.build_number,
    apkUrl: value.apk_url,
    releaseNotes: value.release_notes?.trim() || null,
    minSupportedVersion: value.min_supported_version,
    publishedAt: value.published_at,
  };
}
