import type { AppRelease } from '@/types/app-release';

export const MOCK_PRODUCTION_RELEASE: AppRelease = {
  track: 'production',
  versionName: '1.1.0',
  buildNumber: 142,
  apkUrl: 'https://github.com/roo-tech-300/gida/releases/download/build-142/Gida.apk',
  releaseNotes: 'Walkthrough videos on listings.',
  minSupportedVersion: null,
  publishedAt: '2026-10-28T09:00:00Z',
};

export const MOCK_REQUIRED_RELEASE: AppRelease = {
  ...MOCK_PRODUCTION_RELEASE,
  minSupportedVersion: '1.1.0',
};

/** Raw public.app_releases row as Supabase returns it. */
export const MOCK_APP_RELEASE_ROW = {
  track: 'production',
  version_name: '1.1.0',
  build_number: 142,
  apk_url: 'https://github.com/roo-tech-300/gida/releases/download/build-142/Gida.apk',
  release_notes: '  Walkthrough videos on listings.\n',
  min_supported_version: null,
  published_at: '2026-10-28T09:00:00Z',
};
