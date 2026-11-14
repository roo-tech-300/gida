import { useLocalSearchParams } from 'expo-router';

import { FounderInviteScreen } from '@/components/invite/founder-invite-screen';
import { useUserSlotCredits } from '@/hooks/use-liquidity';

export default function InviteRoute() {
  const { podId, creditId } = useLocalSearchParams<{ podId: string; creditId?: string }>();
  const { data: credits } = useUserSlotCredits();
  const credit = credits?.find((c) => c.id === creditId);
  return <FounderInviteScreen podId={podId} placeTitle={credit?.estate?.name ?? 'your place'} share={credit?.amount_paid ?? 0} />;
}
