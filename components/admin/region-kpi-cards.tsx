import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, fontFamily } from '@/constants/design';

type Props = {
  totalRegions: number | null;
  unassignedRegions: number | null;
};

export function RegionKpiCards({ totalRegions, unassignedRegions }: Props) {
  return (
    <View style={styles.metricsRow}>
      <View style={styles.metricCard}>
        <Text style={styles.metricValue}>{totalRegions === null ? '—' : String(totalRegions)}</Text>
        <Text style={styles.metricLabel}>Total Regions</Text>
      </View>
      <View style={styles.metricCard}>
        <View style={styles.metricValueRow}>
          <Text style={[styles.metricValue, styles.metricValueWarn]}>{unassignedRegions === null ? '—' : String(unassignedRegions)}</Text>
          {(unassignedRegions ?? 0) > 0 && <Ionicons name="alert-circle" size={16} color={DesignColors.warning} />}
        </View>
        <Text style={[styles.metricLabel, styles.metricLabelWarn]}>Unassigned</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricsRow: { flexDirection: 'row', gap: 10, paddingBottom: 4 },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    backgroundColor: DesignColors.surface,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  metricValue: { fontSize: 20, fontWeight: '800', color: DesignColors.onSurface, fontFamily },
  metricValueWarn: { color: DesignColors.warning },
  metricLabel: {
    fontSize: 12, fontWeight: '700', color: DesignColors.primary, fontFamily,
    marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4,
  },
  metricLabelWarn: { color: DesignColors.warning },
  metricValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
