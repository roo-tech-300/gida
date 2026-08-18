import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeTour,
  fetchAdminTourDetail,
  fetchAdminTours,
  type AdminTourView,
} from '@/services/admin-tour-service';

export function useAdminTours(view: AdminTourView = 'active') {
  return useQuery({
    queryKey: ['admin-tours', view],
    queryFn: () => fetchAdminTours(view),
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

export function useCompleteTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeTour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tours'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tour'] });
    },
  });
}
