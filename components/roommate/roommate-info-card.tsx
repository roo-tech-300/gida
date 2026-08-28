import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export type InfoItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

export function RoommateInfoCard({ title, items }: { title: string; items: InfoItem[] }) {
  if (items.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={item.label} style={[styles.row, index > 0 && styles.rowBorder]}>
            <View style={styles.iconBox}>
              <Ionicons name={item.icon} size={20} color={DesignColors.onSurfaceVariant} />
            </View>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    overflow: 'hidden',
  },
  title: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    paddingHorizontal: DesignSpacing.lg,
    paddingTop: DesignSpacing.lg,
    paddingBottom: DesignSpacing.sm,
  },
  list: {
    paddingBottom: DesignSpacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    paddingHorizontal: DesignSpacing.lg,
    paddingVertical: DesignSpacing.md,
    minHeight: 56,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DesignColors.cardBorder,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
  value: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
});
