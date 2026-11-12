import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PayLinkSummary } from '@/services/payment-link-service';
import { formatNaira } from '@/utils/format-naira';
import { formatHoldDeadline } from '@/utils/reservation-state';

import { PayColors } from './pay-theme';

export function PaySummaryCard({ summary }: { summary: PayLinkSummary }) {
  const name = summary.studentFirstName ?? 'Your child';
  return (
    <View style={styles.card} testID="pay-summary">
      <Text style={styles.eyebrow}>{name.toUpperCase()} NEEDS YOUR HELP TO KEEP THIS SPOT</Text>
      <Text style={styles.place}>{summary.listingTitle ?? 'A place on Gida'}</Text>
      {summary.location ? (
        <View style={styles.row}>
          <Ionicons name="location-outline" size={15} color={PayColors.muted} />
          <Text style={styles.muted}>{summary.location}</Text>
        </View>
      ) : null}
      <View style={styles.divider} />
      <Text style={styles.label}>Amount to pay</Text>
      <Text style={styles.amount} testID="pay-amount">{summary.amount ? formatNaira(summary.amount) : '—'}</Text>
      <Text style={styles.muted}>
        {summary.targetOccupancy && summary.targetOccupancy > 1
          ? `${name}'s share of the rent, 1 of ${summary.targetOccupancy}.`
          : `The rent for ${name}'s place.`}
      </Text>
      {summary.deadline ? (
        <View style={styles.hold}>
          <Ionicons name="time-outline" size={16} color={PayColors.goldDark} />
          <Text style={styles.holdText}>Spot held until {formatHoldDeadline(summary.deadline)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 6, padding: 20, borderRadius: 20, backgroundColor: PayColors.card, borderWidth: 1, borderColor: PayColors.border },
  eyebrow: { fontSize: 11, lineHeight: 15, fontWeight: '800', letterSpacing: 0.8, color: PayColors.gold },
  place: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: PayColors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  muted: { fontSize: 14, lineHeight: 20, color: PayColors.muted, flexShrink: 1 },
  divider: { height: 1, backgroundColor: PayColors.border, marginVertical: 10 },
  label: { fontSize: 13, color: PayColors.muted, fontWeight: '600' },
  amount: { fontSize: 34, lineHeight: 40, fontWeight: '800', color: PayColors.ink, letterSpacing: -0.5 },
  hold: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: PayColors.goldTint,
  },
  holdText: { fontSize: 14, fontWeight: '600', color: PayColors.goldDark, flexShrink: 1 },
});
