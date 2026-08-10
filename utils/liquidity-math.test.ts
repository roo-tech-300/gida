import {
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
      
      // Option 1: Solo
      expect(options[0].label).toBe('Just Me (Private)');
      expect(options[0].targetOccupancy).toBe(1);

      // Option 2: Live with 1
      expect(options[1].label).toBe('Live with 1 Roommate (2 People Total)');
      expect(options[1].description).toContain('sharing common areas with 1 matched roommate');

      // Option 4: Max density
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
