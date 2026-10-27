import { UPDATE_SNOOZE_MS, type UpdateSnooze } from '@/utils/app-update-status';

const SNOOZE_KEY = 'gida:app-update-snooze';

// The global localStorage comes from expo-sqlite's polyfill (installed by
// lib/supabase); treat it as optional so a storage failure never blocks the app.
function storage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

export function readUpdateSnooze(): UpdateSnooze | null {
  try {
    const raw = storage()?.getItem(SNOOZE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UpdateSnooze>;
    return typeof parsed.version === 'string' && typeof parsed.until === 'number'
      ? { version: parsed.version, until: parsed.until }
      : null;
  } catch (error) {
    console.error('[AppUpdates] Could not read the update snooze:', error);
    return null;
  }
}

export function snoozeUpdate(version: string, now: number = Date.now()): UpdateSnooze {
  const snooze = { version, until: now + UPDATE_SNOOZE_MS };
  try {
    storage()?.setItem(SNOOZE_KEY, JSON.stringify(snooze));
  } catch (error) {
    console.error('[AppUpdates] Could not save the update snooze:', error);
  }
  return snooze;
}
