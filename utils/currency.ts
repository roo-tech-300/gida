/** Compact naira formatting shared by budget labels and pod price chips. */
export function formatCompactAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '0';
  if (amount >= 1_000_000) {
    const value = amount / 1_000_000;
    return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}M`;
  }
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(Math.round(amount));
}

/** e.g. `₦1.2M`, `₦400k`. */
export function formatNairaCompact(amount: number): string {
  return `₦${formatCompactAmount(amount)}`;
}
