import { useMemo } from 'react';
import type { SlotCredit } from '@/types/liquidity';

export function useExpiredLodges(reservations: SlotCredit[] | undefined, currentTime: number) {
  return useMemo(() => {
    const fortyEightHoursMs = 48 * 60 * 60 * 1000;
    const lodges: SlotCredit[] = [];
    (reservations ?? []).forEach((credit) => {
      if (credit.status !== 'expired') return;

      let isWithin48h = false;
      if (credit.expired_at) {
        const expiredTime = new Date(credit.expired_at).getTime();
        isWithin48h = currentTime - expiredTime <= fortyEightHoursMs;
      } else if (credit.payment_deadline) {
        const paymentDeadline = new Date(credit.payment_deadline).getTime();
        isWithin48h = currentTime - paymentDeadline <= fortyEightHoursMs;
      }

      if (isWithin48h) lodges.push(credit);
    });
    return lodges;
  }, [currentTime, reservations]);
}
