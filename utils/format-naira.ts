/**
 * Shared naira display: whole naira render with no decimals, fractional naira
 * (e.g. equal pod shares with kobo) render with exactly two decimals.
 */
export function formatNaira(amount: number): string {
  const normalized = Number.isFinite(amount) ? amount : 0;
  const fractionDigits = Number.isInteger(normalized) ? 0 : 2;
  return `₦${normalized.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}