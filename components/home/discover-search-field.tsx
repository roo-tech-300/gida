import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = { placeholder: string; onPress: () => void; trailing?: ReactNode };

/** Looks like a search box, opens the full search overlay. */
export function DiscoverSearchField({ placeholder, onPress, trailing }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
        accessibilityRole="search"
        accessibilityLabel={placeholder}
        testID="discover-search-field"
      >
        <Ionicons name="search" size={18} color={DesignColors.onSurfaceVariant} />
        <Text style={styles.placeholder} numberOfLines={1}>{placeholder}</Text>
      </Pressable>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, marginHorizontal: DesignSpacing.marginMobile },
  field: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, height: 48,
    paddingHorizontal: 16, borderRadius: DesignRadius.lg, backgroundColor: DesignColors.surfaceContainer,
    borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  pressed: { opacity: 0.75 },
  placeholder: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, flex: 1 },
});
