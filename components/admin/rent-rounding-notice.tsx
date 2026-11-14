import { StyleSheet, Text } from 'react-native';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { formatNaira } from '@/utils/format-naira';
import { roundUpRent } from '@/utils/round-up-rent';

/** Tells the admin when the rent they typed will be raised so every household size pays whole naira. */
export function RentRoundingNotice({ price, maxRoommates }: { price: string; maxRoommates: number }) {
  const entered = parseFloat(price.replace(/,/g, ''));
  const saved = roundUpRent(entered, maxRoommates);
  if (!Number.isFinite(entered) || saved === entered) return null;

  return (
    <Text style={styles.notice} accessibilityRole="alert">
      Rent will be saved as {formatNaira(saved)}, rounded up from {formatNaira(entered)} so it splits into whole naira
      for any household of 1 to {maxRoommates} students.
    </Text>
  );
}

const styles = StyleSheet.create({
  notice: { ...DesignTypography.labelSm, color: DesignColors.warning, fontFamily, lineHeight: 17 },
});
