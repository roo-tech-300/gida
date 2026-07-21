import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import {
  createClaim,
  addRoommate,
  removeRoommate,
  acceptInvite,
  declineInvite,
  markPaid,
  getActiveClaimForListing,
  getClaimWithRoommates,
  getStudentClaims,
  searchProfiles,
} from '@/services/claim-service';

export function useActiveClaimForListing(listingId: string | null) {
  return useQuery({
    queryKey: ['active-claim', listingId],
    queryFn: () => getActiveClaimForListing(listingId!),
    enabled: !!listingId,
  });
}

export function useClaimDetails(applicationId: string | null) {
  return useQuery({
    queryKey: ['claim-details', applicationId],
    queryFn: () => getClaimWithRoommates(applicationId!),
    enabled: !!applicationId,
  });
}

export function useClaimHistory() {
  const { profile } = useAuth();
  const userId = profile?.id;

  return useQuery({
    queryKey: ['claim-history', userId],
    queryFn: () => getStudentClaims(userId!),
    enabled: !!userId,
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const userId = profile?.id;

  return useMutation({
    mutationFn: async ({ listingId, splitAmount }: { listingId: string; splitAmount: number }) => {
      if (!userId) throw new Error('Not authenticated');
      return createClaim(listingId, userId, splitAmount);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['active-claim', variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ['claim-history', userId] });
    },
  });
}

export function useAddRoommate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applicationId,
      studentId,
      splitAmount,
    }: {
      applicationId: string;
      studentId: string;
      splitAmount: number;
    }) => addRoommate(applicationId, studentId, splitAmount),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['claim-details', variables.applicationId] });
    },
  });
}

export function useRemoveRoommate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, studentId }: { applicationId: string; studentId: string }) =>
      removeRoommate(applicationId, studentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['claim-details', variables.applicationId] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, studentId }: { applicationId: string; studentId: string }) =>
      acceptInvite(applicationId, studentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['claim-details', variables.applicationId] });
    },
  });
}

export function useDeclineInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, studentId }: { applicationId: string; studentId: string }) =>
      declineInvite(applicationId, studentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['claim-details', variables.applicationId] });
    },
  });
}

export function useMarkPaid() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const userId = profile?.id;

  return useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) =>
      markPaid(applicationId, userId!),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['claim-details', variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ['claim-history', userId] });
    },
  });
}

export function useSearchProfiles(query: string) {
  return useQuery({
    queryKey: ['search-profiles', query],
    queryFn: () => searchProfiles(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}
