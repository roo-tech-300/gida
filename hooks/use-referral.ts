import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import {
  ensureReferralCode,
  buildReferralLink,
  fetchReferralEarningsSummary,
} from '@/services/referral-service';
import type { ReferralEarningsSummary } from '@/types/referral';

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
    staleTime: 5 * 60 * 1000,
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