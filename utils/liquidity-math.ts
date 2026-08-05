export type IntentOption = {
  intent: number;
  label: string;
  description: string;
  disabled: boolean;
  reason?: string;
};

export function isValidIntentSize(tier: number, intentSize: number): boolean {
  if (intentSize < 1 || intentSize > tier || !Number.isInteger(intentSize)) {
    return false;
  }
  const isOddTier = tier % 2 !== 0;
  if (isOddTier && intentSize !== 1 && intentSize !== tier) {
    return false;
  }
  return true;
}

export function calculateSplitAmount(totalPrice: number, intentSize: number, tier: number): number {
  if (tier <= 0 || !isValidIntentSize(tier, intentSize)) {
    return 0;
  }
  const perSlotRate = totalPrice / tier;
  return Math.ceil(perSlotRate * intentSize);
}

export function canFinalizePod(currentTotalIntent: number, targetTier: number): boolean {
  return currentTotalIntent === targetTier && targetTier > 0;
}

export function getAvailableIntentOptions(inputTier: number): IntentOption[] {
  const tier = (inputTier > 0 && inputTier <= 8) ? inputTier : 4;
  const options: IntentOption[] = [];
  for (let i = 1; i <= tier; i++) {
    const valid = isValidIntentSize(tier, i);
    let label = `${i} Slot${i > 1 ? 's' : ''}`;
    let description = `Reserve ${i} bed${i > 1 ? 's' : ''} in a Tier ${tier} property.`;
    if (i === tier) {
      label = i === 1 ? 'Single Room Buyout' : 'Full Property Buyout';
      description = 'You reserve the entire property privately.';
    } else if (i === 2 && tier === 4) {
      label = '2 Slots (1 Roommate)';
      description = 'You share the 4-bed apartment with exactly 1 roommate.';
    } else if (i === 1) {
      description = `You get 1 slot and share with up to ${tier - 1} roommate${tier - 1 > 1 ? 's' : ''}.`;
    }
    options.push({
      intent: i,
      label,
      description,
      disabled: !valid,
      reason: !valid ? 'Odd-tier rule: Must purchase exactly 1 slot or 100% buyout.' : undefined,
    });
  }
  return options;
}

export function calculateSeparateBillingPerPerson(totalPrice: number, intentSize: number, tier: number): number {
  if (tier <= 0 || intentSize <= 0 || !isValidIntentSize(tier, intentSize)) {
    return 0;
  }
  const totalReservedAmount = calculateSplitAmount(totalPrice, intentSize, tier);
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

