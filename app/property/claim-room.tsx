import { useLocalSearchParams } from 'expo-router';

import { ClaimRoomScreen } from '@/components/claim/claim-room-screen';

export default function ClaimRoomRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) return null;

  return <ClaimRoomScreen listingId={id} />;
}
