import {
  isValidIntentSize,
  calculateSplitAmount,
  canFinalizePod,
  getAvailableIntentOptions,
} from './liquidity-math';

describe('Liquidity Math Rules & Edge Case Defense', () => {
  describe('Case B: Odd-Numbered Tiers (isValidIntentSize)', () => {
    it('allows only intent 1 or full buyout in Tier 3 properties', () => {
      expect(isValidIntentSize(3, 1)).toBe(true);
      expect(isValidIntentSize(3, 2)).toBe(false); // Rejected!
      expect(isValidIntentSize(3, 3)).toBe(true);
    });

    it('allows all intent sizes in even Tier 4 properties', () => {
      expect(isValidIntentSize(4, 1)).toBe(true);
      expect(isValidIntentSize(4, 2)).toBe(true); // Case A: 1 roommate in 4-slot room
      expect(isValidIntentSize(4, 3)).toBe(true);
      expect(isValidIntentSize(4, 4)).toBe(true);
    });
  });

  describe('Case A & Pricing Split Calculation', () => {
    it('calculates precise split amounts for valid intents', () => {
      expect(calculateSplitAmount(1200000, 2, 4)).toBe(600000);
      expect(calculateSplitAmount(900000, 1, 3)).toBe(300000);
    });

    it('returns 0 for invalid intent configurations', () => {
      expect(calculateSplitAmount(900000, 2, 3)).toBe(0);
    });
  });

  describe('Pod Finalization & Minting Triggers', () => {
    it('returns true when current total intent equals target property tier', () => {
      expect(canFinalizePod(4, 4)).toBe(true);
      expect(canFinalizePod(2, 4)).toBe(false);
    });
  });

  describe('getAvailableIntentOptions', () => {
    it('generates options array with proper disabled state for odd tiers', () => {
      const options = getAvailableIntentOptions(3);
      expect(options).toHaveLength(3);
      expect(options[0].disabled).toBe(false);
      expect(options[1].disabled).toBe(true);
      expect(options[1].reason).toContain('Odd-tier rule');
      expect(options[2].disabled).toBe(false);
    });
  });
});
