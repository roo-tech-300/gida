import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchPayLinkSummary } from '@/services/payment-link-service';
import { verifyLodgePayment } from '@/services/lodge-payment-service';

const CONFIRM_POLL_MS = 3000;

export function payLinkKey(token: string) {
  return ['pay-link', token] as const;
}

/** Loads what the parent sees. While a just-made payment is being confirmed it keeps checking. */
export function usePayLink(token: string, isConfirming: boolean) {
  return useQuery({
    queryKey: payLinkKey(token),
    queryFn: () => fetchPayLinkSummary(token),
    staleTime: 15_000,
    retry: 1,
    refetchInterval: (query) => (isConfirming && query.state.data?.status !== 'paid' ? CONFIRM_POLL_MS : false),
  });
}

/**
 * After Paystack sends the parent back with ?reference=..., ask the worker to confirm it once.
 * The webhook normally gets there first; this just closes the gap if it is slow.
 */
export function usePayConfirmation(token: string, reference: string | undefined) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['pay-confirm', reference],
    enabled: Boolean(reference),
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      const result = await verifyLodgePayment(reference ?? '');
      await queryClient.invalidateQueries({ queryKey: payLinkKey(token) });
      return result.verified;
    },
  });
}
