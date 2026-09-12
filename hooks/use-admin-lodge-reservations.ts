import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import {
  fetchAdminLodgeReservations,
  fetchAdminLodgeDetail,
  acceptReservation,
  rejectReservation,
  type AdminLodgeView,
} from '@/services/admin-lodge-verification-service';

export function useAdminLodgeReservations(view: AdminLodgeView = 'pending') {
  const { profile } = useAuth();
  const adminId = profile?.id ?? '';

  return useQuery({
    queryKey: ['admin-lodge-reservations', view, adminId],
    queryFn: () => fetchAdminLodgeReservations(adminId, view),
    enabled: !!adminId,
    staleTime: 30_000,
  });
}

export function useAdminLodgeDetail(podId: string | undefined) {
  return useQuery({
    queryKey: ['admin-lodge-detail', podId],
    queryFn: () => fetchAdminLodgeDetail(podId ?? ''),
    enabled: Boolean(podId),
  });
}

export function useAcceptLodgeReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lodge-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-lodge-detail'] });
      queryClient.invalidateQueries({ queryKey: ['user-slot-credits'] });
    },
  });
}

export function useRejectLodgeReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ podId, reason }: { podId: string; reason: string }) => rejectReservation(podId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lodge-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-lodge-detail'] });
    },
  });
}
