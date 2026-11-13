import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, fontFamily } from '@/constants/design';

type Props = { count: number; onPress: () => void };

/** Square button beside the search field; the badge shows how many filters are on. */
export function PlaceFilterButton({ count, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, count > 0 && styles.buttonOn]}
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `Filters, ${count} active` : 'Filters'}
      testID="place-filter-button"
    >
      <Ionicons name="options-outline" size={22} color={count > 0 ? DesignColors.onPrimary : DesignColors.onSurface} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainer, borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  buttonOn: { backgroundColor: DesignColors.primary, borderColor: DesignColors.primary },
  badge: {
    position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.onSurface,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: DesignColors.surface, fontFamily },
});
