import { allocateEvenShares, verifyRevenueParity } from '@/utils/liquidity-math';
import type { PodMember } from '@/types/liquidity';

export function memberAmount(rent: number, target: number, memberIndex: number): number {
  return allocateEvenShares(rent, target).shares[memberIndex] ?? 0;
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
