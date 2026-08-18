import { useMutation } from '@tanstack/react-query';
import { initializeLodgePayment, type InitializeLodgePaymentResult } from '@/services/lodge-payment-service';

type LodgePaymentInput = {
  creditId: string;
  listingId: string;
  targetOccupancy: number;
};

export function useInitializeLodgePayment() {
  return useMutation<InitializeLodgePaymentResult, Error, LodgePaymentInput>({
    mutationFn: (input) => initializeLodgePayment(input.creditId, input.listingId, input.targetOccupancy),
    onError: (error) => {
      console.error('[useInitializeLodgePayment] Mutation failed:', error);
    },
  });
}
