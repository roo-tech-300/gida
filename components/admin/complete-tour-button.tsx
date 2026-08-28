import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useCompleteTour } from '@/hooks/use-admin-tours';
import { useAppToast } from '@/components/ui/toast-card';
import type { TourBookingStatus } from '@/types/tour-booking';

type Props = {
  bookingId: string;
  status: TourBookingStatus;
};

export function CompleteTourButton({ bookingId, status }: Props) {
  const completeTour = useCompleteTour();
  const { showToast } = useAppToast();

  if (status !== 'booked') {
    return null;
  }

  const handlePress = () => {
    Alert.alert(
      'Complete this tour?',
      'Marks this tour as completed and removes it from the active queue.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete tour',
          style: 'destructive',
          onPress: () => {
            completeTour.mutate(bookingId, {
              onSuccess: (done) => {
                if (done) {
                  showToast({ message: 'Tour marked as completed.', type: 'success' });
                } else {
                  showToast({ message: 'Could not update this tour. Please try again.', type: 'error' });
                }
              },
              onError: () => {
                showToast({ message: 'Could not update this tour. Please try again.', type: 'error' });
              },
            });
          },
        },
      ],
    );
  };

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.button} onPress={handlePress}>
        <Ionicons name="checkmark-circle-outline" size={18} color={DesignColors.onPrimary} />
        <Text style={styles.text}>Mark tour as completed</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: DesignSpacing.sm },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primary,
    borderRadius: DesignRadius.full,
    height: 52,
  },
  text: { ...DesignTypography.bodyLg, color: DesignColors.onPrimary, fontFamily, fontWeight: '700' },
});
