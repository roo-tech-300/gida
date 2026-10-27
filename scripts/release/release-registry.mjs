// Release registry for Android builds (used by .github/workflows/build-android.yml).
//
//   node scripts/release/release-registry.mjs check
//     Computes the native fingerprint and fails if native code changed while
//     app.json "version" stayed the same (OTA updates would then reach APKs
//     that lack the new native code). Writes NATIVE_FINGERPRINT to $GITHUB_ENV.
//     Run it before `expo prebuild`: the generated android/ folder would
//     change the fingerprint.
//
//   node scripts/release/release-registry.mjs record
//     Inserts the release into public.app_releases so installed apps on the
//     same track are offered the update.
//
// Environment: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RELEASE_TRACK
// (production | preview); `record` also needs BUILD_NUMBER, APK_URL, GIT_SHA,
// NATIVE_FINGERPRINT and optionally RELEASE_NOTES.

import { appendFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const TRACKS = ['production', 'preview'];
// Sources that never change the native binary.
const FINGERPRINT_SKIPS = [
  'ExpoConfigVersions',
  'ExpoConfigEASProject',
  'ExpoConfigExtraSection',
  'PackageJsonScriptsAll',
  'GitIgnore',
];

function required(name) {
  // Node CI script, never bundled by Metro, so dynamic env access is fine.
  // eslint-disable-next-line expo/no-dynamic-env-var
  const value = process.env[name];
  if (!value) throw new Error(`[release] Missing environment variable ${name}`);
  return value;
}

function track() {
  const value = required('RELEASE_TRACK');
  if (!TRACKS.includes(value)) throw new Error(`[release] RELEASE_TRACK must be one of ${TRACKS.join(', ')}`);
  return value;
}

function versionName() {
  return JSON.parse(readFileSync('app.json', 'utf8')).expo.version;
}

async function supabase(path, init = {}) {
  const base = required('SUPABASE_URL').replace(/\/$/, '');
  const key = required('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (!response.ok) {
    throw new Error(`[release] Supabase ${init.method ?? 'GET'} ${path} failed: ${response.status} ${await response.text()}`);
  }
  // Inserts with `Prefer: return=minimal` answer 201 with an empty body.
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function latestRelease(releaseTrack, filter = '') {
  const rows = await supabase(
    `app_releases?select=build_number,version_name,native_fingerprint,min_supported_version` +
      `&platform=eq.android&track=eq.${releaseTrack}${filter}&order=build_number.desc&limit=1`,
  );
  return rows[0] ?? null;
}

async function nativeFingerprint(releaseTrack) {
  // Fixed inputs so every build of a track hashes the same app config.
  process.env.APP_VARIANT = releaseTrack === 'preview' ? 'preview' : 'production';
  delete process.env.BUILD_NUMBER;
  delete process.env.EXPO_UPDATES_CHANNEL;

  // @expo/fingerprint ships with expo-updates; resolve it from there.
  const require = createRequire(createRequire(import.meta.url).resolve('expo-updates/package.json'));
  const { createFingerprintAsync, SourceSkips } = require('@expo/fingerprint');
  // The API takes a bitmask (named lists only work in fingerprint.config.js).
  const sourceSkips = FINGERPRINT_SKIPS.reduce((mask, name) => mask | SourceSkips[name], 0);
  const { hash } = await createFingerprintAsync(process.cwd(), { sourceSkips, silent: true });
  return hash;
}

async function check() {
  const releaseTrack = track();
  const version = versionName();
  const fingerprint = await nativeFingerprint(releaseTrack);
  const previous = await latestRelease(releaseTrack, `&version_name=eq.${encodeURIComponent(version)}`);

  console.log(`[release] ${releaseTrack} ${version}: native fingerprint ${fingerprint}`);
  if (previous && previous.native_fingerprint !== fingerprint) {
    throw new Error(
      `[release] Native code changed since build ${previous.build_number}, but app.json "version" is still ${version}.\n` +
        '          Bump "version" in app.json so OTA updates from this code only reach APKs that contain the new native code.',
    );
  }
  console.log(previous ? `[release] Matches build ${previous.build_number}.` : `[release] First ${releaseTrack} release of ${version}.`);

  if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `NATIVE_FINGERPRINT=${fingerprint}\n`);
}

async function record() {
  const releaseTrack = track();
  const buildNumber = Number(required('BUILD_NUMBER'));
  const previous = await latestRelease(releaseTrack);

  const row = {
    track: releaseTrack,
    platform: 'android',
    version_name: versionName(),
    build_number: buildNumber,
    apk_url: required('APK_URL'),
    release_notes: process.env.RELEASE_NOTES?.trim().slice(0, 2000) || null,
    // Carry the team's "must update" threshold forward.
    min_supported_version: previous?.min_supported_version ?? null,
    native_fingerprint: required('NATIVE_FINGERPRINT'),
    git_sha: required('GIT_SHA'),
  };
  await supabase('app_releases', { method: 'POST', body: JSON.stringify(row), headers: { Prefer: 'return=minimal' } });
  console.log(
    `[release] Recorded ${releaseTrack} ${row.version_name} (build ${buildNumber}), ` +
      `min supported version ${row.min_supported_version ?? 'none'}.`,
  );
}

const commands = { check, record };
const command = commands[process.argv[2]];
if (!command) {
  console.error(`Usage: node scripts/release/release-registry.mjs <${Object.keys(commands).join('|')}>`);
  process.exit(2);
}
command().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
