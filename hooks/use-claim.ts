import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import {
  createClaim,
  addRoommate,
  removeRoommate,
  acceptInvite,
  declineInvite,
  markPaid,
  cancelClaim,
  getActiveClaimForListing,
  getActiveClaimAnyListing,
  getClaimByApplicationId,
  getClaimByListingId,
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

export function useHasActiveClaim() {
  const { profile } = useAuth();
  const userId = profile?.id;

  return useQuery({
    queryKey: ['active-claim-any'],
    queryFn: () => getActiveClaimAnyListing(),
    enabled: !!userId,
  });
}

export function useClaimByApplicationId(applicationId: string | null) {
  return useQuery({
    queryKey: ['claim-details', applicationId],
    queryFn: () => getClaimByApplicationId(applicationId!),
    enabled: !!applicationId,
  });
}

export function useClaimByListingId(listingId: string | null) {
  return useQuery({
    queryKey: ['claim-details', listingId],
    queryFn: () => getClaimByListingId(listingId!),
    enabled: !!listingId,
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
      queryClient.invalidateQueries({ queryKey: ['active-claim'] });
      queryClient.invalidateQueries({ queryKey: ['active-claim-any'] });
      queryClient.invalidateQueries({ queryKey: ['claim-details'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-details'] });
      queryClient.invalidateQueries({ queryKey: ['active-claim'] });
    },
  });
}

export function useRemoveRoommate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, studentId }: { applicationId: string; studentId: string }) =>
      removeRoommate(applicationId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-details'] });
      queryClient.invalidateQueries({ queryKey: ['active-claim'] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, studentId }: { applicationId: string; studentId: string }) =>
      acceptInvite(applicationId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-details'] });
      queryClient.invalidateQueries({ queryKey: ['active-claim'] });
    },
  });
}

export function useDeclineInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, studentId }: { applicationId: string; studentId: string }) =>
      declineInvite(applicationId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-details'] });
      queryClient.invalidateQueries({ queryKey: ['active-claim'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-details'] });
      queryClient.invalidateQueries({ queryKey: ['active-claim'] });
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

export function useCancelClaim() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const userId = profile?.id;

  return useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) =>
      cancelClaim(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-claim'] });
      queryClient.invalidateQueries({ queryKey: ['active-claim-any'] });
      queryClient.invalidateQueries({ queryKey: ['claim-details'] });
      queryClient.invalidateQueries({ queryKey: ['claim-history', userId] });
    },
  });
}
