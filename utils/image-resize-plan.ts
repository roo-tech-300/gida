export type ResizeTarget = { width: number } | { height: number };

/**
 * Decides how to shrink an image so its longest edge is at most `maxEdge`.
 * Returns null when the image is already small enough (never upscale).
 */
export function planResize(
  width: number,
  height: number,
  maxEdge: number,
): ResizeTarget | null {
  if (width <= 0 || height <= 0 || maxEdge <= 0) return null;
  if (Math.max(width, height) <= maxEdge) return null;
  return width >= height ? { width: maxEdge } : { height: maxEdge };
}
