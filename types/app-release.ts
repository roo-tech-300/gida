export type ReleaseTrack = 'production' | 'preview';

/** Row of public.app_releases (written by CI, see docs/RELEASING.md). */
export interface AppRelease {
  track: ReleaseTrack;
  versionName: string;
  buildNumber: number;
  apkUrl: string;
  releaseNotes: string | null;
  /** Installed versions below this must update; null means none are forced. */
  minSupportedVersion: string | null;
  publishedAt: string;
}

export type AppUpdateStatus =
  | { kind: 'none' }
  | { kind: 'available'; release: AppRelease }
  | { kind: 'required'; release: AppRelease };
