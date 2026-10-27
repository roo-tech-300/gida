import { MOCK_APP_RELEASE_ROW, MOCK_PRODUCTION_RELEASE, MOCK_REQUIRED_RELEASE } from '@/dummy/app-release-mock';
import { parseAppRelease } from '@/utils/app-release-mapper';
import { getAppUpdateStatus, isSnoozed, UPDATE_SNOOZE_MS } from '@/utils/app-update-status';
import { compareVersions, isValidVersion } from '@/utils/version-compare';

describe('compareVersions', () => {
  it('compares numerically, not as text', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBeGreaterThan(0);
    expect(compareVersions('1.0.0', '1.0.1')).toBeLessThan(0);
    expect(compareVersions('1.1', '1.1.0')).toBe(0);
  });

  it('validates dotted numeric versions', () => {
    expect(isValidVersion('1.1.0')).toBe(true);
    expect(isValidVersion('1.1.0-beta')).toBe(false);
    expect(isValidVersion(null)).toBe(false);
  });
});

describe('getAppUpdateStatus', () => {
  it('offers a newer version', () => {
    expect(getAppUpdateStatus('1.0.0', MOCK_PRODUCTION_RELEASE)).toEqual({ kind: 'available', release: MOCK_PRODUCTION_RELEASE });
  });

  it('stays quiet for newer builds of the same version (they arrive over the air)', () => {
    expect(getAppUpdateStatus('1.1.0', { ...MOCK_PRODUCTION_RELEASE, buildNumber: 999 })).toEqual({ kind: 'none' });
  });

  it('requires an update below the minimum supported version', () => {
    expect(getAppUpdateStatus('1.0.0', MOCK_REQUIRED_RELEASE).kind).toBe('required');
    expect(getAppUpdateStatus('1.1.0', MOCK_REQUIRED_RELEASE).kind).toBe('none');
  });

  it('never prompts on missing or malformed data', () => {
    expect(getAppUpdateStatus('1.0.0', null)).toEqual({ kind: 'none' });
    expect(getAppUpdateStatus('weird', MOCK_PRODUCTION_RELEASE)).toEqual({ kind: 'none' });
    expect(getAppUpdateStatus('1.0.0', { ...MOCK_PRODUCTION_RELEASE, minSupportedVersion: 'x' }).kind).toBe('available');
  });
});

describe('isSnoozed', () => {
  const now = 1_000_000;

  it('hides the same version until the snooze expires', () => {
    const snooze = { version: '1.1.0', until: now + UPDATE_SNOOZE_MS };
    expect(isSnoozed(snooze, MOCK_PRODUCTION_RELEASE, now)).toBe(true);
    expect(isSnoozed(snooze, MOCK_PRODUCTION_RELEASE, now + UPDATE_SNOOZE_MS + 1)).toBe(false);
  });

  it('shows a newer version even while snoozed', () => {
    const snooze = { version: '1.1.0', until: now + UPDATE_SNOOZE_MS };
    expect(isSnoozed(snooze, { ...MOCK_PRODUCTION_RELEASE, versionName: '1.2.0' }, now)).toBe(false);
  });
});

describe('parseAppRelease', () => {
  it('maps a row and trims notes', () => {
    expect(parseAppRelease(MOCK_APP_RELEASE_ROW)).toEqual({ ...MOCK_PRODUCTION_RELEASE, releaseNotes: 'Walkthrough videos on listings.' });
  });

  it('rejects rows without a usable https APK link or known track', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(parseAppRelease({ ...MOCK_APP_RELEASE_ROW, apk_url: 'http://insecure/Gida.apk' })).toBeNull();
    expect(parseAppRelease({ ...MOCK_APP_RELEASE_ROW, track: 'beta' })).toBeNull();
    expect(parseAppRelease(null)).toBeNull();
    expect(spy).toHaveBeenCalledTimes(3);
    spy.mockRestore();
  });
});
