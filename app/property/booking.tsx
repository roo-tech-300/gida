import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { BookingConfirmationScreen } from '@/components/claim/booking-confirmation-screen';
import { DesignColors } from '@/constants/design';

export default function BookingRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return <View style={{ flex: 1, backgroundColor: DesignColors.surfaceContainerLowest }} />;
  }

  return <BookingConfirmationScreen creditId={id} />;
}
