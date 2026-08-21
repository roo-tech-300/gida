import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  baseRent: number;
  platformFee: number;
  totalCost: number;
};

export function ClaimSplitSummary({ baseRent, platformFee, totalCost }: Props) {
  const formatNaira = (amount: number) =>
    `₦${amount.toLocaleString('en-US')}`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.accent} />
        <Text style={styles.label}>PAYMENT BREAKDOWN</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.itemLabel}>Base Rent (Property Share)</Text>
        <Text style={styles.itemValue}>{formatNaira(baseRent)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.feeLabelContainer}>
          <Text style={styles.itemLabel}>Platform Service Fee</Text>
          <Ionicons name="information-circle-outline" size={14} color={DesignColors.onSurfaceVariant} />
        </View>
        <Text style={styles.itemValue}>{formatNaira(platformFee)}</Text>
      </View>

      <View style={styles.totalBlock}>
        <Text style={styles.totalLabel}>Total Due Today</Text>
        <Text style={styles.totalValue}>{formatNaira(totalCost)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.md,
    gap: DesignSpacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accent: {
    width: 3,
    height: 14,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryBright,
  },
  label: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemLabel: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  itemValue: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: DesignColors.borderFaint,
  },
  totalBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    borderRadius: DesignRadius.sm,
    paddingHorizontal: DesignSpacing.sm,
    paddingVertical: DesignSpacing.sm + 2,
  },
  totalLabel: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
  totalValue: {
    ...DesignTypography.headlineMd,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '800',
  },
});
