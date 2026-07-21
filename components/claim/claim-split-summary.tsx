import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  totalPrice: number;
  numberOfPeople: number;
};

export function ClaimSplitSummary({ totalPrice, numberOfPeople }: Props) {
  const perPerson = numberOfPeople > 0 ? Math.ceil(totalPrice / numberOfPeople) : totalPrice;

  const formatNaira = (amount: number) =>
    `₦${amount.toLocaleString('en-US')}`;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>PAYMENT SPLIT</Text>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total price</Text>
        <Text style={styles.totalValue}>{formatNaira(totalPrice)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.splitRow}>
        <View style={styles.splitInfo}>
          <Ionicons name="people" size={16} color={DesignColors.primaryBright} />
          <Text style={styles.splitLabel}>{numberOfPeople} {numberOfPeople === 1 ? 'person' : 'people'}</Text>
        </View>
        <View style={styles.splitAmount}>
          <Text style={styles.perPersonLabel}>Each pays</Text>
          <Text style={styles.perPersonValue}>{formatNaira(perPerson)}</Text>
        </View>
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
  label: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  totalValue: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: DesignColors.cardBorder,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  splitLabel: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  splitAmount: {
    alignItems: 'flex-end',
  },
  perPersonLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  perPersonValue: {
    ...DesignTypography.headlineMd,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '800',
  },
});
