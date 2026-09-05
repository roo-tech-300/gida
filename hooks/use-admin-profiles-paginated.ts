import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { fetchAdminProfilesPaginated } from '@/services/adminService';
import type { AdminMember } from '@/types/admin';

export function useAdminProfilesPaginated(limit = 50) {
  return usePaginatedQuery<AdminMember[]>({
    queryKey: ['admin-profiles'],
    queryFn: ({ from, to }) => fetchAdminProfilesPaginated((from / limit) + 1, limit),
    limit,
    staleTime: 5 * 60 * 1000,
  });
}