import { allocateEvenShares, verifyRevenueParity } from '@/utils/liquidity-math';
import type { PodMember } from '@/types/liquidity';

export function memberAmount(rent: number, target: number, memberIndex: number): number {
  return allocateEvenShares(rent, target).shares[memberIndex] ?? 0;
}

/** Identical share for every member of the pod — join order never changes it. */
export function memberEqualAmount(rentNgn: number, memberCount: number): number {
  if (!Number.isFinite(rentNgn) || rentNgn < 0) return 0;
  if (!Number.isInteger(memberCount) || memberCount <= 0) return 0;
  return Math.round((rentNgn / memberCount) * 100) / 100;
}

export function assertRevenueParity(members: PodMember[], rent: number) {
  const expectedTotal = rent;
  const result = verifyRevenueParity(expectedTotal, members.map((m) => m.amount_paid ?? 0));
  if (!result.isParity) {
    console.error(
      `[LiquidityService] Revenue parity violated: expected ${expectedTotal}, collected ${result.totalCollected} (shortfall ${result.shortfall}, overage ${result.overage}).`,
    );
  }
}
