import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';

import { useJoinOpenPod } from '@/hooks/use-join-open-pod';
import type { RecommendedPod } from '@/types/pod-recommendation';

/**
 * Owns the shelf → sheet → payment sequence for the home reel, so the screen
 * only has to wire `openPod` and render `<PodJoinSheet />`.
 */
export function usePodJoinFlow() {
  const router = useRouter();
  const { joinPod, isJoining } = useJoinOpenPod();
  const [selectedPod, setSelectedPod] = useState<RecommendedPod | null>(null);

  const openPod = useCallback((pod: RecommendedPod) => setSelectedPod(pod), []);
  const closePod = useCallback(() => setSelectedPod(null), []);

  const joinSelectedPod = useCallback(async () => {
    if (!selectedPod) return;

    const credit = await joinPod({ pod: selectedPod, listing: selectedPod.listing });
    if (!credit) return;

    setSelectedPod(null);
    router.push({ pathname: '/property/pay-slot', params: { id: credit.id } });
  }, [selectedPod, joinPod, router]);

  return { selectedPod, openPod, closePod, joinSelectedPod, isJoining };
}
