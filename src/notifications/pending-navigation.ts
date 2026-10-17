/**
 * Module-level store for a push notification navigation intent that arrived
 * before auth was ready (cold-start / killed-app tap).
 *
 * The NotificationNavigationListener writes here instead of calling
 * router.push() directly. AuthGate reads and consumes it once the user is
 * confirmed authenticated and the router is stable.
 *
 * Using a plain module variable (not React state) avoids re-render cycles and
 * works across the component boundary between the listener and AuthGate.
 */

let _pendingPath: string | null = null;

export function setPendingPushNavigation(path: string): void {
  _pendingPath = path;
}

export function consumePendingPushNavigation(): string | null {
  const path = _pendingPath;
  _pendingPath = null;
  return path;
}

export function hasPendingPushNavigation(): boolean {
  return _pendingPath !== null;
}
