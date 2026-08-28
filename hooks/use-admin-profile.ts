import { useQuery } from '@tanstack/react-query';
import { fetchAdminProfile } from '@/services/adminService';

export function useAdminProfile(adminId: string | null | undefined) {
  return useQuery({
    queryKey: ['admin-profile', adminId],
    queryFn: () => fetchAdminProfile(adminId ?? ''),
    enabled: !!adminId,
  });
}
