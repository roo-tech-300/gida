import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelReservation } from '@/services/reservation-cancel-service';

/** Cancels an unpaid reservation, then refreshes everything that shows reservations or spots left. */
export function useCancelReservation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: cancelReservation,
    onSuccess: () => {
      for (const key of ['user-slot-credits', 'spots-left', 'active-pods', 'open-pods']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
