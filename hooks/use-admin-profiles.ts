import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createAdminProfile,
  fetchAdminProfiles,
  fetchRegions,
  searchAdminCandidates,
  type CreateAdminProfileInput,
} from '@/services/adminService';
import { fetchRecentAdminActivity, fetchSuperAdminStats } from '@/services/super-admin-service';

export function useAdminProfiles() {
  return useQuery({
    queryKey: ['admin-profiles'],
    queryFn: fetchAdminProfiles,
    staleTime: 30_000,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchSuperAdminStats,
    staleTime: 30_000,
  });
}

export function useRecentAdminActivity() {
  return useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => fetchRecentAdminActivity(5),
    staleTime: 30_000,
  });
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
    staleTime: 5 * 60_000,
  });
}

export function useSearchAdminCandidates(query: string) {
  return useQuery({
    queryKey: ['admin-candidates', query],
    queryFn: () => searchAdminCandidates(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useCreateAdminProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAdminProfileInput) => createAdminProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    },
  });
}
