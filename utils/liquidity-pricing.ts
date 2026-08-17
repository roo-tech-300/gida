import { allocateEvenShares, verifyRevenueParity } from '@/utils/liquidity-math';
import type { PodMember } from '@/types/liquidity';

export function memberAmount(rent: number, fee: number, target: number, memberIndex: number): number {
  const rentShare = allocateEvenShares(rent, target).shares[memberIndex] ?? 0;
  const feeShare = allocateEvenShares(fee, target).shares[memberIndex] ?? 0;
  return rentShare + feeShare;
}

export function assertRevenueParity(members: PodMember[], rent: number, fee: number) {
  const expectedTotal = rent + fee;
  const result = verifyRevenueParity(expectedTotal, members.map((m) => m.amount_paid ?? 0));
  if (!result.isParity) {
    console.error(
      `[LiquidityService] Revenue parity violated: expected ${expectedTotal}, collected ${result.totalCollected} (shortfall ${result.shortfall}, overage ${result.overage}).`,
    );
  }
}
