# Releasing the Android app

Gida is distributed as an APK from GitHub Releases (not the Play Store yet).
There are two ways a change reaches users:

| Change | How it ships | Users do |
|---|---|---|
| JavaScript / assets only | OTA update (`Publish OTA update` workflow) | Nothing; the app picks it up on next launch |
| Native (new native library, config plugin, permissions, icons, intent filters…) | New APK with a bumped `version` | Install the new APK when the app prompts them |

## Tracks

| | Production | Preview |
|---|---|---|
| App | **Gida** (`com.eluzia.Gida`) | **Gida Preview** (`com.eluzia.Gida.preview`); installs next to Gida |
| Built from | Push to `builds` | PR into `builds` with the `preview-build` label |
| GitHub release | `build-N`, marked latest | `preview-N`, marked pre-release |
| OTA channel | `production` | `preview` |
| Who is prompted | Gida installs | Gida Preview installs only |

`dev` still produces a debug APK (channel `tester`) as a workflow artifact.

A production app only reads production releases, and GitHub's "latest" link
(used by the landing page) skips pre-releases, so a preview can never reach
regular users.

## Version numbers

- **`version` in `app.json`** (e.g. `1.1.0`) is also the OTA runtime version.
  **Bump it whenever native code changes.** OTA updates only go to APKs with the
  same `version`, so the bump keeps new JavaScript away from APKs that don't
  have the matching native code.
- **Build number** (Android `versionCode`) is the GitHub Actions run number,
  set automatically. It also names the release (`build-N` / `preview-N`).

CI enforces the first rule: before building, it fingerprints the native
project and fails if the fingerprint differs from an earlier release of the
same `version`. The fix is to bump `version`.

## Testing a feature before release

1. Open a PR into `builds`.
2. Add the `preview-build` label. CI builds Gida Preview, publishes the same
   code as an OTA update on the `preview` channel, and comments the download
   link on the PR.
3. Every new push to the labelled PR does the same. Testers already on that
   version get the changes on their next app launch; if the PR bumped
   `version`, Gida Preview prompts them to install the new APK.
4. Merge when approved. The push to `builds` produces the production release.

Notes:

- Previews use the **production Supabase project**. Database changes in a
  preview PR must be safe for the current production app (additive
  migrations), and testers should use test accounts for payments and bookings.
- Only one preview build exists at a time: if two labelled PRs build, testers
  get whichever finished last.
- Gida Preview doesn't open `www.gida.apartments` links (those stay with Gida).
  It shares the `gida://` scheme, so after paying in Preview, Android asks
  which app to open.

## What users see

On Android release builds (`production` and `preview` channels), the app
checks `app_releases` for its track at launch and when it returns to the
foreground (at most once an hour):

- **Update available**: the newest release has a higher `version` than the
  installed APK. A dismissible sheet with release notes; *Later* hides it for
  3 days, and a newer version shows again. *Download update* opens the APK in
  the browser, and Android's installer takes over.
- **Update required**: the installed version is below `min_supported_version`.
  A full-screen block with only a download button.

Newer builds of the same `version` never prompt; their JavaScript arrives as
OTA updates. Debug APKs from `dev` (channel `tester`), dev mode and web never
check.

### Release notes ("What's new")

The sheet's notes come only from the **`## Release notes`** section of the PR
description (the PR template includes it). CI reads it from the labelled PR
for previews, and from the merged PR for production pushes to `builds`. Write
for students, 1–4 short lines. If the section is missing or empty, the release
has no notes and the sheet hides the box; commit messages are never used.
A same-version rebuild without notes (e.g. a CI-only change) keeps the
previous release's notes, since older installs are offered the newest row.

To change the notes of a release that's already out, edit its row; installs
see it on their next check (within an hour):

```sql
UPDATE public.app_releases SET release_notes = E'• First line\n• Second line'
WHERE track = 'production' AND build_number = 139;
```

## Forcing an update

Every release is recorded in the Supabase table `public.app_releases`. The app
offers an update when the newest release on its track has a higher `version`
than the installed APK. To make everyone below a version update before they
can continue, set `min_supported_version` on the newest row of that track (CI
carries it forward):

```sql
UPDATE public.app_releases SET min_supported_version = '1.1.0'
WHERE id = (SELECT id FROM public.app_releases
            WHERE track = 'production' ORDER BY build_number DESC LIMIT 1);
```

## One-time setup

- Apply `supabase/migrations/20261028_app_releases.sql`.
- Repository secret `SUPABASE_SERVICE_ROLE_KEY` (CI writes `app_releases`).
  Preview builds also use the existing `EXPO_TOKEN` to publish OTA updates.
- Create the `preview-build` label in GitHub.
- Firebase: add an Android app with package `com.eluzia.Gida.preview` and
  commit the updated `google-services.json`. Preview builds fail without it
  (push notifications are tied to the package name).
