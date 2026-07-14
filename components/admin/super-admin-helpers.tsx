import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, fontFamily } from '@/constants/design';

export const ADMIN_COLORS = DesignColors;

export function IconPill({ name, size = 20, color }: { name: keyof typeof Ionicons.glyphMap; size?: number; color: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={helpersStyles.metricCard}>
      <Text style={helpersStyles.metricLabel}>{label}</Text>
      <Text style={helpersStyles.metricValue}>{value}</Text>
    </View>
  );
}

export function RegionStat({ label, value, color, icon }: { label: string; value: string; color?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={helpersStyles.regionStatItem}>
      <Text style={helpersStyles.regionStatLabel}>{label}</Text>
      <View style={helpersStyles.regionStatValueRow}>
        <Text style={[helpersStyles.regionStatValue, color ? { color } : undefined]}>{value}</Text>
        {icon && <Ionicons name={icon} size={14} color={color} />}
      </View>
    </View>
  );
}

const helpersStyles = StyleSheet.create({
  metricCard: {
    flex: 1,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  metricLabel: { fontSize: 10, fontWeight: '700', color: DesignColors.onPrimaryContainer, fontFamily, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7 },
  metricValue: { fontSize: 24, fontWeight: '700', color: DesignColors.onPrimaryContainer, fontFamily },
  regionStatItem: { flex: 1, gap: 4 },
  regionStatLabel: { fontSize: 10, fontWeight: '700', color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6 },
  regionStatValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  regionStatValue: { fontSize: 18, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
});
