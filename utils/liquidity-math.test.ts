import {
  isValidIntentSize,
  calculateSplitAmount,
  canFinalizePod,
  getAvailableIntentOptions,
  calculateSeparateBillingPerPerson,
  verifyPodRevenueParity,
} from './liquidity-math';

describe('Liquidity Math Rules & Edge Case Defense', () => {
  describe('Case B: Odd-Numbered Tiers & Fairness Defense (isValidIntentSize)', () => {
    it('allows only intent 1 or full buyout in Tier 3 properties under Solo mode', () => {
      expect(isValidIntentSize(3, 1, false)).toBe(true);
      expect(isValidIntentSize(3, 2, false)).toBe(false); // Rejected solo for financial fairness!
      expect(isValidIntentSize(3, 3, false)).toBe(true);
    });

    it('allows 2 slots in Tier 3 properties under Friend mode via individual decomposition', () => {
      expect(isValidIntentSize(3, 2, true)).toBe(true); // Permitted! Each friend pays equal share.
    });

    it('allows all intent sizes in even Tier 4 properties', () => {
      expect(isValidIntentSize(4, 1)).toBe(true);
      expect(isValidIntentSize(4, 2)).toBe(true);
      expect(isValidIntentSize(4, 3)).toBe(true);
      expect(isValidIntentSize(4, 4)).toBe(true);
    });
  });

  describe('Case A & Pricing Split Calculation', () => {
    it('calculates precise split amounts for valid intents', () => {
      expect(calculateSplitAmount(1200000, 2, 4)).toBe(600000);
      expect(calculateSplitAmount(900000, 1, 3)).toBe(300000);
      expect(calculateSplitAmount(900000, 2, 3, true)).toBe(600000); // 2 friends in 3-bed property
    });

    it('returns 0 for invalid intent configurations', () => {
      expect(calculateSplitAmount(900000, 2, 3, false)).toBe(0); // Invalid solo!
    });
  });

  describe('Pod Finalization & Minting Triggers', () => {
    it('returns true when current total intent equals target property tier', () => {
      expect(canFinalizePod(4, 4)).toBe(true);
      expect(canFinalizePod(2, 4)).toBe(false);
    });
  });

  describe('getAvailableIntentOptions', () => {
    it('generates options array with proper disabled state for odd tiers under solo mode', () => {
      const options = getAvailableIntentOptions(3, false);
      expect(options).toHaveLength(3);
      expect(options[0].disabled).toBe(false);
      expect(options[1].disabled).toBe(true);
      expect(options[1].reason).toContain('Solo odd-tier fairness rule');
      expect(options[2].disabled).toBe(false);
    });

    it('generates enabled options for odd tiers under friend coordination mode', () => {
      const options = getAvailableIntentOptions(3, true);
      expect(options[1].disabled).toBe(false); // 2 slots enabled under friend mode!
      expect(options[1].description).toContain('individual beds');
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

