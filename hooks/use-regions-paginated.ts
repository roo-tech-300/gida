import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { fetchRegionsPaginated } from '@/services/adminService';
import type { AdminRegion } from '@/types/admin';

export function useRegionsPaginated(limit = 100) {
  return usePaginatedQuery<AdminRegion[]>({
    queryKey: ['regions'],
    queryFn: ({ from, to }) => fetchRegionsPaginated((from / limit) + 1, limit),
    limit,
    staleTime: 5 * 60 * 1000,
  });
}