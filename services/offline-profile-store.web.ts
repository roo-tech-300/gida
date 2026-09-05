import type { AuthProfile } from '@/context/auth-context';

const STORAGE_KEY = 'gida_cached_profile';

export function cacheProfile(profile: AuthProfile): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  } catch (error) {
    console.error('[OfflineProfileStore] Failed to cache profile:', error);
  }
}

export function getCachedProfile(): AuthProfile | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthProfile;
  } catch (error) {
    console.error('[OfflineProfileStore] Failed to read cached profile:', error);
    return null;
  }
}

export function clearCachedProfile(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('[OfflineProfileStore] Failed to clear cached profile:', error);
  }
}
