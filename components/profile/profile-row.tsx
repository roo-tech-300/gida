import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
}) {
  return (
    <Pressable style={styles.row}>
      <View style={styles.left}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={24} color={DesignColors.primary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.label}>{label}</Text>
          {value ? <Text style={styles.value}>{value}</Text> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={DesignColors.outlineVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSpacing.lg,
    paddingVertical: DesignSpacing.md,
    minHeight: 56,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: DesignSpacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
  },
  value: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
