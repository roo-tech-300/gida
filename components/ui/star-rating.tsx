import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, fontFamily } from '@/constants/design';

const STAR_SLOTS = [1, 2, 3, 4, 5];

type Props = {
  rating: number;
  size?: number;
  showValue?: boolean;
  count?: number;
};

function starName(rating: number, slot: number): 'star' | 'star-half' | 'star-outline' {
  if (rating >= slot) return 'star';
  if (rating >= slot - 0.5) return 'star-half';
  return 'star-outline';
}

export function StarRating({ rating, size = 14, showValue = false, count }: Props) {
  return (
    <View
      accessibilityLabel={`Rated ${rating.toFixed(1)} out of 5`}
      accessible
      style={styles.row}
    >
      {STAR_SLOTS.map((slot) => (
        <Ionicons
          key={slot}
          color={DesignColors.rating}
          name={starName(rating, slot)}
          size={size}
        />
      ))}
      {showValue && (
        <Text style={[styles.value, { fontSize: Math.max(12, size - 1) }]}>{rating.toFixed(1)}</Text>
      )}
      {typeof count === 'number' && (
        <Text style={[styles.count, { fontSize: Math.max(11, size - 2) }]}>({count})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  value: {
    marginLeft: 4,
    color: DesignColors.textPrimary,
    fontWeight: '700',
    fontFamily,
  },
  count: {
    marginLeft: 2,
    color: DesignColors.textSecondary,
    fontFamily,
  },
});
