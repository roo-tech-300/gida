import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLatestRelease } from '@/services/app-release-service';
import type { AppUpdateStatus } from '@/types/app-release';
import { getAppUpdateStatus, isSnoozed } from '@/utils/app-update-status';
import { getInstalledApp } from '@/utils/installed-app';
import { readUpdateSnooze, snoozeUpdate } from '@/utils/update-snooze';

// One small query per hour at most; releases happen a few times a week.
const RELEASE_STALE_MS = 60 * 60 * 1000;
const NONE: AppUpdateStatus = { kind: 'none' };

export function useAppUpdateStatus() {
  const queryClient = useQueryClient();
  const installed = useMemo(() => getInstalledApp(), []);
  const [snooze, setSnooze] = useState(readUpdateSnooze);
  const queryKey = useMemo(() => ['app-release', installed?.track], [installed]);

  const { data, error } = useQuery({
    queryKey,
    queryFn: () => fetchLatestRelease(installed!.track),
    enabled: installed !== null,
    staleTime: RELEASE_STALE_MS,
    gcTime: 2 * RELEASE_STALE_MS,
  });

  // A missed check must never block the app; it just retries later.
  useEffect(() => {
    if (error) console.error('[AppUpdates] Failed to check for a new release:', error);
  }, [error]);

  // Students leave the app in the background for days; re-check on return,
  // but only once the cached result is older than RELEASE_STALE_MS.
  useEffect(() => {
    if (!installed) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void queryClient.refetchQueries({ queryKey, stale: true });
    });
    return () => subscription.remove();
  }, [installed, queryClient, queryKey]);

  const status = installed && data !== undefined ? getAppUpdateStatus(installed.version, data) : NONE;
  const visible = status.kind === 'available' && isSnoozed(snooze, status.release, Date.now()) ? NONE : status;

  const snoozeOffer = useCallback(() => {
    if (status.kind === 'available') setSnooze(snoozeUpdate(status.release.versionName));
  }, [status]);

  return { status: visible, installedVersion: installed?.version ?? null, snoozeOffer };
}
