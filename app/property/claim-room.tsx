import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ClaimRoomScreen } from '@/components/claim/claim-room-screen';
import { DesignColors } from '@/constants/design';

export default function ClaimRoomRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return <View style={{ flex: 1, backgroundColor: DesignColors.surfaceContainerLowest }} />;
  }

  return <ClaimRoomScreen listingId={id} />;
}
