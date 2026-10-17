import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import {
  ensureReferralCode,
  buildReferralLink,
  fetchReferralEarningsSummary,
  fetchMyReferrals,
  fetchMyWithdrawalRequests,
  submitWithdrawalRequest,
  saveBankDetails,
} from '@/services/referral-service';
import type { ReferralEarningsSummary, ReferralWithProfile, WithdrawalRequest } from '@/types/referral';

export function useReferral() {
  const { profile } = useAuth();
  const userId = profile?.id;

  const {
    data: referralCode,
    isLoading: codeLoading,
    isError: codeError,
    refetch: refetchCode,
  } = useQuery({
    queryKey: ['my-referral-code', userId],
    queryFn: () => ensureReferralCode(userId ?? ''),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: earnings,
    isLoading: earningsLoading,
    isError: earningsError,
    refetch: refetchEarnings,
  } = useQuery<ReferralEarningsSummary>({
    queryKey: ['my-referral-earnings', userId],
    queryFn: () => fetchReferralEarningsSummary(userId ?? ''),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const link = referralCode ? buildReferralLink(referralCode) : null;

  return {
    userId,
    referralCode,
    link,
    isLoading: codeLoading || earningsLoading,
    hasError: codeError || earningsError,
    earnings,
    refetchCode,
    refetchEarnings,
  };
}

// Paginated referrals list with filter support
export function useMyReferrals(filter: 'all' | 'paid') {
  const { profile } = useAuth();
  const userId = profile?.id;

  return useInfiniteQuery<ReferralWithProfile[]>({
    queryKey: ['my-referrals', userId, filter],
    queryFn: ({ pageParam = 1 }) =>
      fetchMyReferrals(userId ?? '', pageParam as number, filter),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

// Withdrawal requests for the current user
export function useMyWithdrawalRequests() {
  const { profile } = useAuth();
  const userId = profile?.id;

  return useQuery<WithdrawalRequest[]>({
    queryKey: ['my-withdrawal-requests', userId],
    queryFn: () => fetchMyWithdrawalRequests(userId ?? ''),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// Mutation: submit a withdrawal request
export function useSubmitWithdrawal() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      amount,
      bankDetails,
    }: {
      amount: number;
      bankDetails: { bank_name: string; account_number: string; account_name: string };
    }) => submitWithdrawalRequest(profile?.id ?? '', amount, bankDetails),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-withdrawal-requests', profile?.id] });
      void qc.invalidateQueries({ queryKey: ['my-referral-earnings', profile?.id] });
    },
  });
}

// Mutation: save bank details to profile
export function useSaveBankDetails() {
  const { profile, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: (details: { bank_name: string; account_number: string; account_name: string }) =>
      saveBankDetails(profile?.id ?? '', details),
    onSuccess: () => void refreshProfile(),
  });
}
