import {
  isValidIntentSize,
  calculateSplitAmount,
  canFinalizePod,
  getAvailableIntentOptions,
  calculateSeparateBillingPerPerson,
  verifyPodRevenueParity,
  derivePropertyTier,
  NO_LIMIT_TIER,
  MAX_PROPERTY_TIER,
  isValidTargetOccupancy,
  getTargetOccupancyOptions,
  calculateBaseRent,
  calculatePlatformFee,
  calculateTotalUserCost,
  verifyPodCompleteness,
} from './liquidity-math';

describe('Dynamic Target Occupancy Math', () => {
  describe('isValidTargetOccupancy', () => {
    it('allows valid occupancies within physical limits', () => {
      expect(isValidTargetOccupancy(4, 1)).toBe(true);
      expect(isValidTargetOccupancy(4, 2)).toBe(true);
      expect(isValidTargetOccupancy(4, 4)).toBe(true);
    });

    it('rejects invalid or out of bounds occupancies', () => {
      expect(isValidTargetOccupancy(4, 0)).toBe(false);
      expect(isValidTargetOccupancy(4, 5)).toBe(false);
      expect(isValidTargetOccupancy(4, 1.5)).toBe(false);
    });
  });

  describe('getTargetOccupancyOptions', () => {
    it('generates the correct human-readable UI options', () => {
      const options = getTargetOccupancyOptions(4);
      expect(options).toHaveLength(4);

      expect(options[0].label).toBe('Just Me (Private)');
      expect(options[0].targetOccupancy).toBe(1);

      expect(options[1].label).toBe('Live with 1 Roommate (2 People Total)');
      expect(options[1].description).toContain('sharing common areas with 1 matched roommate');

      expect(options[3].label).toBe('Live with 3 Roommates (4 People Total)');
      expect(options[3].description).toContain('Most affordable.');
    });
  });

  describe('Pricing & Rent Splits', () => {
    it('calculates the base rent correctly (Math.ceil(totalRent / occupancy))', () => {
      expect(calculateBaseRent(1200000, 1)).toBe(1200000); // Solo
      expect(calculateBaseRent(1200000, 2)).toBe(600000); // 50%
      expect(calculateBaseRent(1200000, 3)).toBe(400000); // 33.3%
      expect(calculateBaseRent(1200000, 4)).toBe(300000); // 25%
    });

    it('calculates the platform fee correctly based on total expected fee', () => {
      const totalPodFee = 20000;
      expect(calculatePlatformFee(totalPodFee, 1)).toBe(20000); // Solo pays all
      expect(calculatePlatformFee(totalPodFee, 2)).toBe(10000); // 2 people split it
      expect(calculatePlatformFee(totalPodFee, 4)).toBe(5000); // 4 people split it
    });

    it('calculates total user cost correctly', () => {
      const totalCost = calculateTotalUserCost(1200000, 20000, 4);
      expect(totalCost).toBe(305000); // 300000 + 5000
    });
  });

  describe('Pod Finalization', () => {
    it('returns true when current intent equals target occupancy', () => {
      expect(verifyPodCompleteness(4, 4)).toBe(true);
      expect(verifyPodCompleteness(2, 2)).toBe(true);
    });

    it('returns false when current intent is less or more than target occupancy', () => {
      expect(verifyPodCompleteness(1, 2)).toBe(false);
      expect(verifyPodCompleteness(3, 2)).toBe(false);
    });
  });
});

describe('Legacy Intent Math & Revenue Parity', () => {
  describe('isValidIntentSize', () => {
    it('blocks partial-majority solo intents on odd tiers', () => {
      expect(isValidIntentSize(3, 1, false)).toBe(true);
      expect(isValidIntentSize(3, 2, false)).toBe(false);
      expect(isValidIntentSize(3, 3, false)).toBe(true);
    });

    it('unlocks partial-majority intents in friend mode', () => {
      expect(isValidIntentSize(3, 2, true)).toBe(true);
    });
  });

  describe('calculateSplitAmount', () => {
    it('prorates the total price across reserved slots', () => {
      expect(calculateSplitAmount(1200000, 2, 4)).toBe(600000);
      expect(calculateSplitAmount(1200000, 1, 4)).toBe(300000);
    });

    it('returns 0 for invalid intents', () => {
      expect(calculateSplitAmount(1200000, 2, 3, false)).toBe(0);
    });
  });

  describe('canFinalizePod', () => {
    it('only finalizes when intent matches tier', () => {
      expect(canFinalizePod(4, 4)).toBe(true);
      expect(canFinalizePod(3, 4)).toBe(false);
    });
  });

  describe('getAvailableIntentOptions', () => {
    it('generates enabled options for odd tiers under friend coordination mode', () => {
      const options = getAvailableIntentOptions(3, true);
      expect(options[1].disabled).toBe(false); // 2 slots enabled under friend mode!
      expect(options[1].description).toContain('individual slots');
    });

    it('generates a full set of enabled intents for an even No-Limit tier', () => {
      const options = getAvailableIntentOptions(NO_LIMIT_TIER, false);
      expect(options).toHaveLength(NO_LIMIT_TIER);
      expect(options.every((opt) => !opt.disabled)).toBe(true);
    });
  });

  describe('derivePropertyTier (maxRoommates as tier source)', () => {
    it('prefers a stored property_tier column', () => {
      expect(derivePropertyTier(3, 5)).toBe(3);
    });

    it('falls back to max_roommates when no tier column exists', () => {
      expect(derivePropertyTier(undefined, 4)).toBe(4);
      expect(derivePropertyTier(null, 2)).toBe(2);
      expect(derivePropertyTier(null, 9)).toBe(9);
      expect(derivePropertyTier(null, NO_LIMIT_TIER)).toBe(NO_LIMIT_TIER);
    });

    it('accepts the top-of-range tier stored on the property column', () => {
      expect(derivePropertyTier(NO_LIMIT_TIER, NO_LIMIT_TIER)).toBe(NO_LIMIT_TIER);
      expect(derivePropertyTier(MAX_PROPERTY_TIER, 2)).toBe(MAX_PROPERTY_TIER);
    });

    it('ignores the legacy No-Limit sentinel (999) and out-of-range values', () => {
      expect(derivePropertyTier(undefined, 999)).toBe(NO_LIMIT_TIER);
      expect(derivePropertyTier(undefined, 15)).toBe(NO_LIMIT_TIER);
      expect(derivePropertyTier(0, 0)).toBe(NO_LIMIT_TIER);
    });

    it('defaults to the no-limit tier when nothing is provided', () => {
      expect(derivePropertyTier()).toBe(NO_LIMIT_TIER);
      expect(derivePropertyTier(null, null)).toBe(NO_LIMIT_TIER);
    });
  });

  describe('Separate Billing Math & Revenue Parity Verification', () => {
    it('accurately divides total reserved amount across independent roommate invoices', () => {
      const perPerson = calculateSeparateBillingPerPerson(1200000, 2, 4);
      expect(perPerson).toBe(300000);
    });

    it('verifies 100% revenue parity when pod slots are completely filled via separate invoices', () => {
      const parityResult = verifyPodRevenueParity(1200000, 4, [1, 1, 2]);
      expect(parityResult.isParity).toBe(true);
      expect(parityResult.totalCollected).toBeGreaterThanOrEqual(1200000);
      expect(parityResult.shortfall).toBe(0);
    });

    it('returns false for parity if total slots do not equal property tier', () => {
      const incomplete = verifyPodRevenueParity(1200000, 4, [1, 2]);
      expect(incomplete.isParity).toBe(false);
      expect(incomplete.shortfall).toBe(300000);
    });
  });
});
