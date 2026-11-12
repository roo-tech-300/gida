/** Only scarcity is worth saying out loud: "2 spots left" or "Full". Plenty of room says nothing. */
export const SPOTS_LEFT_THRESHOLD = 3;

export function spotsLeftLabel(spotsLeft: number | undefined): string | null {
  if (spotsLeft === undefined || !Number.isFinite(spotsLeft)) return null;
  if (spotsLeft <= 0) return 'Full';
  if (spotsLeft <= SPOTS_LEFT_THRESHOLD) return spotsLeft === 1 ? '1 spot left' : `${spotsLeft} spots left`;
  return null;
}

/** Validates the get_spots_left payload: a map of listing id to a non-negative whole number. */
export function parseSpotsLeft(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  const result: Record<string, number> = {};
  for (const [id, count] of Object.entries(value)) {
    if (typeof count === 'number' && Number.isFinite(count) && count >= 0) result[id] = Math.floor(count);
  }
  return result;
}
