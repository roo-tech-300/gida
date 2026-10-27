/**
 * Layout math for the pod shelf grid.
 *
 * The shelf shows between 1 and 6 pods. A single pod still renders (as one
 * large tile) so a sparse marketplace never leaves the feed without a
 * discovery surface.
 */

export const MIN_SHELF_PODS = 1;
export const MAX_SHELF_PODS = 6;

export type PodGrid = {
  /** Number of pods actually rendered, clamped to the supported range. */
  count: number;
  columns: number;
  rows: number;
};

export function clampShelfCount(count: number): number {
  if (!Number.isFinite(count)) return MIN_SHELF_PODS;
  return Math.min(MAX_SHELF_PODS, Math.max(MIN_SHELF_PODS, Math.trunc(count)));
}

/**
 * 1 → one hero tile, 2 → a row of two, 3 → a row of three,
 * 4 → 2×2, 5–6 → two rows of three (last row short).
 */
export function getPodGrid(count: number): PodGrid {
  if (!Number.isFinite(count) || count <= 0) {
    return { count: 0, columns: 1, rows: 0 };
  }

  const visible = clampShelfCount(count);
  const columns = visible === 1 ? 1 : visible === 2 ? 2 : visible === 4 ? 2 : 3;

  return { count: visible, columns, rows: Math.ceil(visible / columns) };
}

/** Slice helper so the shelf can never render more tiles than it can fit. */
export function takeShelfPods<T>(pods: readonly T[]): T[] {
  return pods.slice(0, MAX_SHELF_PODS);
}
