-- ---------------------------------------------------------------------------
-- Android release registry for the in-app update prompt.
--
-- CI (build-android.yml) inserts one row per release APK. The app reads the
-- newest row for its own track:
--   * production — APKs built from the `builds` branch (GitHub releases).
--   * preview    — "Gida Preview" APKs built from PRs labelled
--                  `preview-build` (GitHub pre-releases).
-- A production app never reads preview rows, so pre-releases can't prompt
-- regular users.
--
-- The app compares versions, not build numbers: version_name is the OTA
-- runtime version, which the installed APK reports reliably even after OTA
-- updates (Updates.runtimeVersion).
--
-- To force everyone below a version to update, set min_supported_version on
-- the newest row of that track, e.g.:
--   UPDATE public.app_releases SET min_supported_version = '1.1.0'
--   WHERE id = (SELECT id FROM public.app_releases
--               WHERE track = 'production' ORDER BY build_number DESC LIMIT 1);
-- CI copies the value forward to every later release.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.app_releases (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  track text NOT NULL CHECK (track IN ('production', 'preview')),
  platform text NOT NULL DEFAULT 'android' CHECK (platform IN ('android')),
  -- app.json "version"; doubles as the runtime version for OTA updates.
  version_name text NOT NULL,
  -- Android versionCode (the GitHub Actions run number).
  build_number integer NOT NULL CHECK (build_number > 0),
  apk_url text NOT NULL,
  release_notes text,
  -- Installed versions below this one are told they must update (NULL: none).
  min_supported_version text CHECK (min_supported_version ~ '^[0-9]+(\.[0-9]+)*$'),
  -- @expo/fingerprint hash of the native project; CI refuses to release a
  -- changed fingerprint under an unchanged version_name.
  native_fingerprint text NOT NULL,
  git_sha text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_releases_track_build_key UNIQUE (track, platform, build_number)
);

CREATE INDEX IF NOT EXISTS idx_app_releases_latest
  ON public.app_releases (track, platform, build_number DESC);

ALTER TABLE public.app_releases ENABLE ROW LEVEL SECURITY;

-- The update check runs before sign-in too, and the APK links are public.
DROP POLICY IF EXISTS "Anyone can read app releases" ON public.app_releases;
CREATE POLICY "Anyone can read app releases"
  ON public.app_releases
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access on app releases" ON public.app_releases;
CREATE POLICY "Service role full access on app releases"
  ON public.app_releases
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
