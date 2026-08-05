export type IntentOption = {
  intent: number;
  label: string;
  description: string;
  disabled: boolean;
  reason?: string;
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

export function getAvailableIntentOptions(inputTier: number, isFriendMode = false): IntentOption[] {
  const tier = (inputTier > 0 && inputTier <= 8) ? inputTier : 4;
  const options: IntentOption[] = [];
  for (let i = 1; i <= tier; i++) {
    const valid = isValidIntentSize(tier, i, isFriendMode);
    let label = `${i} Slot${i > 1 ? 's' : ''}`;
    let description = `Reserve ${i} bed${i > 1 ? 's' : ''} in a Tier ${tier} property.`;
    if (i === tier) {
      label = i === 1 ? 'Single Room Buyout' : 'Full Property Buyout';
      description = 'You reserve the entire property privately.';
    } else if (i === 2 && tier === 4) {
      label = isFriendMode ? '2 Slots (Me & 1 Classmate)' : '2 Slots (50% Capacity)';
      description = isFriendMode
        ? 'Reserve 2 individual beds for you and a classmate under separate invoices.'
        : 'Reserve 50% capacity (2 slots). Remaining 2 slots are matched with 1 or 2 compatible peers in lobby.';
    } else if (i === 1) {
      description = `Reserve 1 slot. You will be paired with up to ${tier - 1} compatible student peer${tier - 1 > 1 ? 's' : ''} in the Matching Lobby.`;
    } else if (isFriendMode && i > 1 && i < tier) {
      description = `Reserve ${i} individual beds for your classmate group under separate billing.`;
    }
    options.push({
      intent: i,
      label,
      description,
      disabled: !valid,
      reason: !valid ? 'Solo odd-tier fairness rule: Cannot purchase partial majority solo. Switch to Friend Coordination or select 1 slot.' : undefined,
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


export function verifyPodRevenueParity(
  totalAnnualRent: number,
  propertyTier: number,
  memberIntentSizes: number[],
): { isParity: boolean; totalCollected: number; shortfall: number } {
  if (propertyTier <= 0 || totalAnnualRent <= 0) {
    return { isParity: false, totalCollected: 0, shortfall: totalAnnualRent };
  }
  const perSlotRate = Math.ceil(totalAnnualRent / propertyTier);
  const totalCollected = memberIntentSizes.reduce((sum, size) => sum + Math.ceil(perSlotRate * size), 0);
  const shortfall = Math.max(0, totalAnnualRent - totalCollected);
  const totalSlots = memberIntentSizes.reduce((a, b) => a + b, 0);
  return {
    isParity: totalCollected >= totalAnnualRent && totalSlots === propertyTier,
    totalCollected,
    shortfall,
  };
}

