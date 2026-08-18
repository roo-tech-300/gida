import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { PaymentCheckoutScreen } from '@/components/payment/payment-checkout-screen';
import { DesignColors } from '@/constants/design';

export default function PaySlotRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return <View style={{ flex: 1, backgroundColor: DesignColors.surfaceContainerLowest }} />;
  }

  return <PaymentCheckoutScreen creditId={id} />;
}
