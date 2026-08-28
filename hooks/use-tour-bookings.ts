import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTourAvailability, fetchTourBookings, reserveTour } from '@/services/tour-booking-service';

export function useTourAvailability(listingId: string, adminId?: string | null) {
  return useQuery({
    queryKey: ['tour-availability', listingId, adminId ?? null],
    queryFn: () => fetchTourAvailability(listingId, adminId),
    enabled: !!listingId,
    staleTime: 30_000,
  });
}

export function useTourBookings() {
  return useQuery({
    queryKey: ['tour-bookings'],
    queryFn: fetchTourBookings,
    staleTime: 30_000,
  });
}

export function useReserveTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reserveTour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-availability'] });
    },
  });
}
