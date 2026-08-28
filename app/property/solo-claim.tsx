import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { SoloClaimScreen } from '@/components/claim/solo-claim-screen';
import { DesignColors } from '@/constants/design';

export default function SoloClaimRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return <View style={{ flex: 1, backgroundColor: DesignColors.surfaceContainerLowest }} />;
  }

  return <SoloClaimScreen listingId={id} />;
}
