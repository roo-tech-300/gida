import { Platform } from 'react-native';

import { isAllowedRedirect } from '@/utils/pending-redirect';

const KEY = 'gida.pendingRedirect';
let pending: string | null = null;

function webStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Remembers an invite link to return to after sign-in. Anything that is not an invite link is ignored. */
export function setPendingRedirect(path: string): void {
  if (!isAllowedRedirect(path)) return;
  pending = path;
  try {
    webStorage()?.setItem(KEY, path);
  } catch (error) {
    console.error('[PendingRedirect] Could not remember the link in this browser:', error);
  }
}

/** Returns the remembered link once, then forgets it. */
export function takePendingRedirect(): string | null {
  let stored: string | null = null;
  try {
    stored = webStorage()?.getItem(KEY) ?? null;
    webStorage()?.removeItem(KEY);
  } catch (error) {
    console.error('[PendingRedirect] Could not read the remembered link:', error);
  }
  const found = pending ?? stored;
  pending = null;
  return isAllowedRedirect(found) ? found : null;
}
