import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  amenities: string[];
};

export function PropertyAmenitiesList({ amenities }: Props) {
  if (amenities.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerBar} />
        <Text style={styles.header}>ALL AMENITIES</Text>
      </View>
      <View style={styles.card}>
        {amenities.map((item, index) => (
          <View key={`${item}-${index}`} style={[styles.row, index > 0 && styles.rowBorder]}>
            <View style={styles.checkBg}>
              <Ionicons name="checkmark" size={14} color={DesignColors.primaryBright} />
            </View>
            <Text style={styles.rowText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: DesignSpacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, marginBottom: DesignSpacing.md },
  headerBar: { width: 3, height: 14, borderRadius: 2, backgroundColor: DesignColors.primaryBright },
  header: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1.4 },
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: DesignColors.borderFaint,
    paddingHorizontal: DesignSpacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, paddingVertical: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: DesignColors.borderFaint },
  checkBg: {
    width: 26,
    height: 26,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  rowText: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, flex: 1 },
});
