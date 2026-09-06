import {
  isValidIntentSize,
  calculateSplitAmount,
  canFinalizePod,
  getAvailableIntentOptions,
  calculateSeparateBillingPerPerson,
  allocateEvenShares,
  verifyRevenueParity,
  derivePropertyTier,
  NO_LIMIT_TIER,
  MAX_PROPERTY_TIER,
  isValidTargetOccupancy,
  getTargetOccupancyOptions,
  calculateBaseRent,
  calculateTotalUserCost,
  verifyPodCompleteness,
  podEffectiveGender,
  isGenderCompatible,
  podOpenSlotStatus,
  countRealMembers,
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

    it('offers every occupancy up to the max property tier (no 8-slot cap)', () => {
      expect(getTargetOccupancyOptions(MAX_PROPERTY_TIER)).toHaveLength(MAX_PROPERTY_TIER);
      expect(getTargetOccupancyOptions(10)[9].targetOccupancy).toBe(10);
      expect(getTargetOccupancyOptions(0)).toHaveLength(MAX_PROPERTY_TIER);
    });
  });

  describe('Pricing & Rent Splits', () => {
    it('calculates the base rent correctly (Math.ceil(totalRent / occupancy))', () => {
      expect(calculateBaseRent(1200000, 1)).toBe(1200000); // Solo
      expect(calculateBaseRent(1200000, 2)).toBe(600000); // 50%
      expect(calculateBaseRent(1200000, 3)).toBe(400000); // 33.3%
      expect(calculateBaseRent(1200000, 4)).toBe(300000); // 25%
    });

    it('calculates total user cost as the rent share only (no fees)', () => {
      expect(calculateTotalUserCost(1200000, 4)).toBe(300000);
      expect(calculateTotalUserCost(1200000, 1)).toBe(1200000);
      expect(calculateTotalUserCost(1200000, 2)).toBe(600000);
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

  describe('derivePropertyTier (maxRoommates as authoritative capacity)', () => {
    it('prefers max_roommates when both are present and valid', () => {
      expect(derivePropertyTier(3, 5)).toBe(5);
      expect(derivePropertyTier(1, 4)).toBe(4);
    });

    it('falls back to max_roommates when no tier column exists', () => {
      expect(derivePropertyTier(undefined, 4)).toBe(4);
      expect(derivePropertyTier(null, 2)).toBe(2);
      expect(derivePropertyTier(null, 9)).toBe(9);
      expect(derivePropertyTier(null, NO_LIMIT_TIER)).toBe(NO_LIMIT_TIER);
    });

    it('uses the property tier only when max_roommates is missing or invalid', () => {
      expect(derivePropertyTier(NO_LIMIT_TIER, NO_LIMIT_TIER)).toBe(NO_LIMIT_TIER);
      expect(derivePropertyTier(MAX_PROPERTY_TIER, null)).toBe(MAX_PROPERTY_TIER);
      expect(derivePropertyTier(2, 0)).toBe(2);
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

  describe('Separate Billing', () => {
    it('accurately divides total reserved amount across independent roommate invoices', () => {
      expect(calculateSeparateBillingPerPerson(1200000, 2, 4)).toBe(300000);
    });
  });

  describe('Even Share Allocation (No Over-Collection)', () => {
    it('splits evenly with no remainder', () => {
      expect(allocateEvenShares(1200000, 4)).toEqual({ shares: [300000, 300000, 300000, 300000], total: 1200000 });
    });

    it('spreads the remainder across the first members so the sum is exact', () => {
      expect(allocateEvenShares(1000000, 3)).toEqual({ shares: [333334, 333333, 333333], total: 1000000 });
      expect(allocateEvenShares(101, 4)).toEqual({ shares: [26, 25, 25, 25], total: 101 });
    });

    it('returns empty for invalid counts', () => {
      expect(allocateEvenShares(1000000, 0)).toEqual({ shares: [], total: 0 });
      expect(allocateEvenShares(1000000, -2)).toEqual({ shares: [], total: 0 });
    });
  });

  describe('Revenue Parity Verification', () => {
    it('confirms parity when collected shares equal the expected total', () => {
      const parity = verifyRevenueParity(1000000, [333334, 333333, 333333]);
      expect(parity.isParity).toBe(true);
      expect(parity.totalCollected).toBe(1000000);
      expect(parity.shortfall).toBe(0);
      expect(parity.overage).toBe(0);
    });

    it('flags over-collection from naive per-member ceil billing', () => {
      const parity = verifyRevenueParity(1000000, [400000, 400000, 400000]);
      expect(parity.isParity).toBe(false);
      expect(parity.overage).toBe(200000);
    });

    it('reports the shortfall when members have not fully paid', () => {
      const parity = verifyRevenueParity(1000000, [200000, 300000]);
      expect(parity.isParity).toBe(false);
      expect(parity.shortfall).toBe(500000);
    });

    it('is never parity for a non-positive expected total', () => {
      expect(verifyRevenueParity(0, [1, 1]).isParity).toBe(false);
    });
  });
});

describe('Gender Compatibility (UI-only roommate policy)', () => {
  const maleMember = (userId: string) => ({ user_id: userId, profile: { gender: 'MALE' as const } });
  const femaleMember = (userId: string) => ({ user_id: userId, profile: { gender: 'FEMALE' as const } });
  const undecidedMember = (userId: string) => ({ user_id: userId, profile: { gender: null } });
  const invitedMember = (userId: string) => ({ user_id: `inv-${userId}`, profile: { gender: 'FEMALE' as const } });
  const noProfileMember = (userId: string) => ({ user_id: userId, profile: null });

  describe('podEffectiveGender', () => {
    it('derives a single resident gender when all real members share it', () => {
      expect(podEffectiveGender({ members: [maleMember('a')] })).toBe('MALE');
      expect(podEffectiveGender({ members: [maleMember('a'), maleMember('b')] })).toBe('MALE');
      expect(podEffectiveGender({ members: [femaleMember('a'), femaleMember('b')] })).toBe('FEMALE');
    });

    it('marks a pod as MIXED when both genders are present', () => {
      expect(podEffectiveGender({ members: [maleMember('a'), femaleMember('b')] })).toBe('MIXED');
    });

    it('returns ANY for an empty or all-undecided pod', () => {
      expect(podEffectiveGender({ members: [] })).toBe('ANY');
      expect(podEffectiveGender({ members: [undecidedMember('a'), noProfileMember('b')] })).toBe('ANY');
    });

    it('ignores pending/invited members when deriving the gender', () => {
      expect(podEffectiveGender({ members: [maleMember('a'), invitedMember('999')] })).toBe('MALE');
    });
  });

  describe('isGenderCompatible', () => {
    it('never auto-pairs a male with a female pod or vice versa', () => {
      expect(isGenderCompatible('FEMALE', 'MALE')).toBe(false);
      expect(isGenderCompatible('MALE', 'FEMALE')).toBe(false);
    });

    it('allows a same-gender match', () => {
      expect(isGenderCompatible('MALE', 'MALE')).toBe(true);
      expect(isGenderCompatible('FEMALE', 'FEMALE')).toBe(true);
    });

    it('never auto-offers a MIXED pod to anyone', () => {
      expect(isGenderCompatible('MIXED', 'MALE')).toBe(false);
      expect(isGenderCompatible('MIXED', 'FEMALE')).toBe(false);
      expect(isGenderCompatible('MIXED', null)).toBe(false);
    });

    it('offers an undecided ANY pod to any viewer', () => {
      expect(isGenderCompatible('ANY', 'MALE')).toBe(true);
      expect(isGenderCompatible('ANY', 'FEMALE')).toBe(true);
    });

    it('treats an undecided viewer as compatible with everything except MIXED', () => {
      expect(isGenderCompatible('MALE', null)).toBe(true);
      expect(isGenderCompatible('FEMALE', null)).toBe(true);
      expect(isGenderCompatible('ANY', null)).toBe(true);
      expect(isGenderCompatible('MIXED', null)).toBe(false);
    });
  });
});

describe('Open Slot Status (empty slot a user can fill)', () => {
  const real = (userId: string) => ({ user_id: userId, slot_credit_id: `credit-${userId}` as const });
  const invited = (id: string) => ({ user_id: `inv-${id}`, slot_credit_id: 'invitation' as const });

  it('reports an open pod when there is a free seat', () => {
    expect(podOpenSlotStatus({ target_occupancy: 3, members: [real('a')] })).toEqual({
      open: true,
      occupied: 1,
      available: 2,
      target: 3,
    });
  });

  it('counts a friend-assigned slot (pending invite) as already occupied', () => {
    expect(podOpenSlotStatus({ target_occupancy: 2, members: [real('a'), invited('9')] })).toEqual({
      open: false,
      occupied: 2,
      available: 0,
      target: 2,
    });
  });

  it('exposes one remaining seat when a friend invite leaves a single slot', () => {
    expect(podOpenSlotStatus({ target_occupancy: 3, members: [real('a'), invited('9')] })).toEqual({
      open: true,
      occupied: 2,
      available: 1,
      target: 3,
    });
  });

  it('treats an empty pod as fully open', () => {
    expect(podOpenSlotStatus({ target_occupancy: 3, members: [] })).toEqual({
      open: true,
      occupied: 0,
      available: 3,
      target: 3,
    });
  });
});

describe('countRealMembers (real member count, ignores pending invites)', () => {
  const real = (userId: string) => ({ user_id: userId, slot_credit_id: `credit-${userId}` as const });
  const invited = (id: string) => ({ user_id: `inv-${id}`, slot_credit_id: 'invitation' as const });

  it('counts only real members, excluding pending invites', () => {
    expect(countRealMembers({ members: [real('founder'), real('joiner'), invited('9')] })).toBe(2);
  });

  it('returns 0 for an empty or absent member list', () => {
    expect(countRealMembers({ members: [] })).toBe(0);
    expect(countRealMembers(undefined)).toBe(0);
  });
});
