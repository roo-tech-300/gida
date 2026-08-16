import { useQuery } from '@tanstack/react-query';
import { fetchAdminTourDetail, fetchAdminTours } from '@/services/admin-tour-service';

export function useAdminTours() {
  return useQuery({
    queryKey: ['admin-tours'],
    queryFn: fetchAdminTours,
    staleTime: 30_000,
  });
}

export function useAdminTourDetail(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['admin-tour', bookingId],
    queryFn: () => fetchAdminTourDetail(bookingId ?? ''),
    enabled: Boolean(bookingId),
  });
}
