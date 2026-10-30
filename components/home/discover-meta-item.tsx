import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';

export function DiscoverMetaItem({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={18} color={DesignColors.textPrimary} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.textPrimary,
    fontFamily,
  },
});
