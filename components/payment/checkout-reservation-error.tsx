import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { DesignColors } from '@/constants/design';
import { styles } from './payment-checkout.styles';

export function CheckoutReservationError({ hasError, onRetry }: { hasError: boolean; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <View style={styles.glassCenterCard}>
        <View style={styles.errorBadge}>
          <Ionicons name="alert-circle-outline" size={32} color={DesignColors.error} />
        </View>
        <Text style={styles.mutedText}>
          {hasError ? 'Could not check this reservation. Check your connection and retry.' : 'Reservation not found.'}
        </Text>
        {hasError && (
          <Pressable onPress={onRetry} accessibilityRole="button">
            <Text style={styles.payText}>Retry check</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
