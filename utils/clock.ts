/** Current time in ms. A named helper so event handlers stay testable and lint-clean. */
export function nowMs(): number {
  return Date.now();
}
