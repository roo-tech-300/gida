import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  price: number;
};

export function ClaimSplitSummary({ price }: Props) {
  const formatNaira = (amount: number) =>
    `₦${amount.toLocaleString('en-US')}`;

  return (
    <View style={styles.totalBlock}>
      <Text style={styles.totalLabel}>Your Price</Text>
      <Text style={styles.totalValue}>{formatNaira(price)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
