/** The most people a listing can be shared by (matches MAX_PROPERTY_TIER). */
const MAX_PEOPLE = 10;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * A student picks a household of 1 to N people and pays rent ÷ size, so the rent has to divide evenly by
 * every size from 1 to N: the least common multiple (12 for 4 people, 6 for 3, 60 for 6).
 * Mirrors public.rent_split_unit in the database.
 */
export function rentSplitUnit(maxPeople: number): number {
  const limit = Math.min(Math.max(Math.floor(maxPeople) || 1, 1), MAX_PEOPLE);
  let unit = 1;
  for (let size = 2; size <= limit; size += 1) unit = (unit / gcd(unit, size)) * size;
  return unit;
}

/** Rounds the rent UP to a split that gives whole-naira shares. Prices are only ever raised. */
export function roundUpRent(price: number, maxPeople: number): number {
  if (!Number.isFinite(price) || price <= 0) return price;
  const unit = rentSplitUnit(maxPeople);
  return Math.ceil(price / unit) * unit;
}
