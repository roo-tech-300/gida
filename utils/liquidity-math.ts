import type { Pod } from '@/types/liquidity';
export { podEffectiveGender, isGenderCompatible, canJoinPod, countRealMembers, podOpenSlotStatus, findActivePodForCredit, memberPaymentStatus } from '@/utils/liquidity-pod-status';
export type { PodGender, OpenSlotStatus, MemberPaymentStatus } from '@/utils/liquidity-pod-status';

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
        : 'Reserve 50% occupancy (2 slots). The other 2 slots are open to other students looking for roommates.';
    } else if (i === 1) {
      description = `Reserve 1 slot. The other ${tier - 1} slot${tier - 1 > 1 ? 's are' : ' is'} open to other students looking for roommates.`;
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

export const PAYMENT_WINDOW_MS = 3 * 24 * 3600 * 1000;

/**
 * Exact per-person share: the rent split into identical naira amounts, kept to
 * kobo precision. Unlike allocateEvenShares, join order never changes anybody's
 * figure, so every member of a pod pays precisely the same amount.
 */
export function calculateEqualShare(rentNgn: number, memberCount: number): number {
  if (!Number.isFinite(rentNgn) || rentNgn < 0) return 0;
  if (!Number.isInteger(memberCount) || memberCount <= 0) return 0;
  return Math.round((rentNgn / memberCount) * 100) / 100;
}

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

const REVENUE_PARITY_TOLERANCE_NGN = 0.01;

const toMoneyUnits = (value: number): number => Math.round(value * 100);

export function verifyRevenueParity(expectedTotal: number, memberAmounts: number[]): RevenueParity {
  const totalCollected = memberAmounts.reduce((sum, amount) => sum + amount, 0);
  const shortfall = Math.max(0, expectedTotal - totalCollected);
  const overage = Math.max(0, totalCollected - expectedTotal);
  const collectedUnits = toMoneyUnits(totalCollected);
  const expectedUnits = toMoneyUnits(expectedTotal);
  const toleranceUnits = Math.max(1, toMoneyUnits(REVENUE_PARITY_TOLERANCE_NGN) * memberAmounts.length);
  return {
    isParity: expectedTotal > 0 && Math.abs(collectedUnits - expectedUnits) <= toleranceUnits,
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
        ? `Most affordable. Share the house with ${roommateCount} other student${roommateCount > 1 ? 's' : ''} who join your group.`
        : `You get a private room, sharing common areas with ${roommateCount} other student${roommateCount > 1 ? 's' : ''} who join your group.`;
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

export function calculateTotalUserCost(totalRent: number, targetOccupancy: number): number {
  return calculateBaseRent(totalRent, targetOccupancy);
}

export function verifyPodCompleteness(currentTotalIntent: number, targetOccupancy: number): boolean {
  return currentTotalIntent === targetOccupancy && targetOccupancy > 0;
}

export function isPodCreator(pod: Pod | undefined, currentUserId: string | undefined): boolean {
  if (!pod || !currentUserId) return false;
  return pod.founder_user_id === currentUserId;
}
