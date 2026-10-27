import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/auth-context';
import { useUserSlotCredits } from '@/hooks/use-liquidity';
import { fetchLivingPreferences } from '@/services/livingPreferencesService';
import { fetchRecommendedPods } from '@/services/podRecommendationsService';
import type { PodMatchContext, RecommendedPod } from '@/types/pod-recommendation';

/**
 * Recommended open pods for the home feed shelf.
 *
 * Additive on purpose: callers render the shelf only when this query has data.
 * An error here must never block the listing reel, so the feed does not gate
 * on `isError`.
 */
export function useRecommendedPods() {
  const { profile } = useAuth();
  const userId = profile?.id;

  const livingPreferences = useQuery({
    queryKey: ['living-preferences', userId],
    queryFn: () => fetchLivingPreferences(userId as string),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: credits } = useUserSlotCredits();

  const bookedListingIds = useMemo(
    () => [
      ...new Set(
        (credits ?? [])
          .filter((credit) => credit.status !== 'expired' && !!credit.listing_id)
          .map((credit) => credit.listing_id as string),
      ),
    ],
    [credits],
  );

  const context = useMemo<PodMatchContext | null>(() => {
    if (!userId) return null;
    const living = livingPreferences.data;
    return {
      userId,
      gender: profile?.gender ?? null,
      school: profile?.school ?? null,
      minBudget: living?.min_budget ?? null,
      maxBudget: living?.max_budget ?? null,
      preferredArea: living?.preferred_area ?? null,
      bookedListingIds,
      seenPodIds: [],
    };
  }, [userId, profile?.gender, profile?.school, livingPreferences.data, bookedListingIds]);

  return useQuery<RecommendedPod[], Error>({
    queryKey: [
      'recommended-pods',
      userId ?? null,
      context?.minBudget ?? null,
      context?.maxBudget ?? null,
      context?.preferredArea ?? null,
      bookedListingIds.join(','),
    ],
    queryFn: () => fetchRecommendedPods(context as PodMatchContext),
    enabled: !!context && !livingPreferences.isPending,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
