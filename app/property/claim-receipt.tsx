import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ClaimReceiptScreen } from '@/components/claim/claim-receipt-screen';
import { DesignColors } from '@/constants/design';

export default function ClaimReceiptRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return <View style={{ flex: 1, backgroundColor: DesignColors.surfaceContainerLowest }} />;
  }

  return <ClaimReceiptScreen listingId={id} />;
}
