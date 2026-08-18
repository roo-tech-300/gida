export type IntentOption = {
  intent: number;
  label: string;
  description: string;
  disabled: boolean;
  reason?: string;
};

export type TargetOccupancyOption = {
  targetOccupancy: number;
  label: string;
  description: string;
};

export function isValidIntentSize(tier: number, intentSize: number, isFriendMode = false): boolean {
  if (intentSize < 1 || intentSize > tier || !Number.isInteger(intentSize)) {
    return false;
  }
  const isOddTier = tier % 2 !== 0;
  if (isOddTier && intentSize !== 1 && intentSize !== tier && !isFriendMode) {
    return false;
  }
  return true;
}

export function calculateSplitAmount(totalPrice: number, intentSize: number, tier: number, isFriendMode = false): number {
  if (tier <= 0 || !isValidIntentSize(tier, intentSize, isFriendMode)) {
    return 0;
  }
  const perSlotRate = totalPrice / tier;
  return Math.ceil(perSlotRate * intentSize);
}

export function canFinalizePod(currentTotalIntent: number, targetTier: number): boolean {
  return currentTotalIntent === targetTier && targetTier > 0;
}

export const MAX_PROPERTY_TIER = 10;
export const NO_LIMIT_TIER = MAX_PROPERTY_TIER;

function isValidTier(n: number | null | undefined): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= MAX_PROPERTY_TIER;
}

export function derivePropertyTier(propertyTier?: number | null, maxRoommates?: number | null): number {
  if (isValidTier(maxRoommates)) return maxRoommates;
  if (isValidTier(propertyTier)) return propertyTier;
  return NO_LIMIT_TIER;
}

export function getAvailableIntentOptions(inputTier: number, isFriendMode = false): IntentOption[] {
  const tier = (inputTier > 0 && inputTier <= MAX_PROPERTY_TIER) ? inputTier : NO_LIMIT_TIER;
  const options: IntentOption[] = [];
  for (let i = 1; i <= tier; i++) {
    const valid = isValidIntentSize(tier, i, isFriendMode);
    let label = `${i} Slot${i > 1 ? 's' : ''}`;
    let description = `Reserve ${i} slot${i > 1 ? 's' : ''} in a ${tier}-slot property.`;
    if (i === tier) {
      label = i === 1 ? 'Single Slot Buyout' : 'Full Property Buyout';
      description = 'You reserve the entire property privately.';
    } else if (i === 2 && tier === 4) {
      label = isFriendMode ? '2 Slots (Me & 1 Classmate)' : '2 Slots (50% Occupancy)';
      description = isFriendMode
        ? 'Reserve 2 individual slots for you and a classmate under separate student invoices.'
        : 'Reserve 50% occupancy (2 slots). Remaining 2 slots are paired with 1 or 2 compatible classmates in Roommate Matching.';
    } else if (i === 1) {
      description = `Reserve 1 slot. You will be paired with up to ${tier - 1} compatible classmate${tier - 1 > 1 ? 's' : ''} in Roommate Matching.`;
    } else if (isFriendMode && i > 1 && i < tier) {
      description = `Reserve ${i} individual slots for your classmate group under separate student invoices.`;
    }
    options.push({
      intent: i,
      label,
      description,
      disabled: !valid,
      reason: !valid ? 'Fair Rent Policy: Cannot purchase partial majority solo. Switch to Move in with Friends or select 1 slot.' : undefined,
    });
  }
  return options;
}

export function calculateSeparateBillingPerPerson(totalPrice: number, intentSize: number, tier: number, isFriendMode = true): number {
  if (tier <= 0 || intentSize <= 0 || !isValidIntentSize(tier, intentSize, isFriendMode)) {
    return 0;
  }
  const totalReservedAmount = calculateSplitAmount(totalPrice, intentSize, tier, isFriendMode);
  return Math.ceil(totalReservedAmount / intentSize);
}

export const EXPECTED_TOTAL_POD_FEE = 20000;
export const PAYMENT_WINDOW_MS = 3 * 24 * 3600 * 1000;

export function allocateEvenShares(total: number, count: number): { shares: number[]; total: number } {
  if (count <= 0 || total < 0) {
    return { shares: [], total: 0 };
  }
  const base = Math.floor(total / count);
  const remainder = total % count;
  const shares = Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
  return { shares, total: shares.reduce((sum, share) => sum + share, 0) };
}

export type RevenueParity = {
  isParity: boolean;
  totalCollected: number;
  expectedTotal: number;
  shortfall: number;
  overage: number;
};

export function verifyRevenueParity(expectedTotal: number, memberAmounts: number[]): RevenueParity {
  const totalCollected = memberAmounts.reduce((sum, amount) => sum + amount, 0);
  const shortfall = Math.max(0, expectedTotal - totalCollected);
  const overage = Math.max(0, totalCollected - expectedTotal);
  return {
    isParity: expectedTotal > 0 && totalCollected === expectedTotal,
    totalCollected,
    expectedTotal,
    shortfall,
    overage,
  };
}

export function isValidTargetOccupancy(maxRoommates: number, targetOccupancy: number): boolean {
  return targetOccupancy >= 1 && targetOccupancy <= maxRoommates && Number.isInteger(targetOccupancy);
}

export function getTargetOccupancyOptions(maxRoommates: number): TargetOccupancyOption[] {
  const options: TargetOccupancyOption[] = [];
  const max = (maxRoommates > 0 && maxRoommates <= MAX_PROPERTY_TIER) ? maxRoommates : MAX_PROPERTY_TIER;

  for (let i = 1; i <= max; i++) {
    let label = '';
    let description = '';

    if (i === 1) {
      label = 'Just Me (Private)';
      description = 'You get the entire property to yourself.';
    } else {
      const roommateCount = i - 1;
      label = `Live with ${roommateCount} Roommate${roommateCount > 1 ? 's' : ''} (${i} People Total)`;
      description = i === max
        ? `Most affordable. Share the house with ${roommateCount} matched roommate${roommateCount > 1 ? 's' : ''}.`
        : `You get a private room, sharing common areas with ${roommateCount} matched roommate${roommateCount > 1 ? 's' : ''}.`;
    }

    options.push({
      targetOccupancy: i,
      label,
      description,
    });
  }
  return options;
}

export function calculateBaseRent(totalRent: number, targetOccupancy: number): number {
  if (targetOccupancy <= 0) return 0;
  return Math.ceil(totalRent / targetOccupancy);
}

export function calculatePlatformFee(totalPodFee: number, targetOccupancy: number): number {
  if (targetOccupancy <= 0) return 0;
  return Math.ceil(totalPodFee / targetOccupancy);
}

export function calculateTotalUserCost(totalRent: number, totalPodFee: number, targetOccupancy: number): number {
  return calculateBaseRent(totalRent, targetOccupancy) + calculatePlatformFee(totalPodFee, targetOccupancy);
}

export function verifyPodCompleteness(currentTotalIntent: number, targetOccupancy: number): boolean {
  return currentTotalIntent === targetOccupancy && targetOccupancy > 0;
}
