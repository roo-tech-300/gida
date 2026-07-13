import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { fontFamily } from '@/constants/design';

export const ADMIN_COLORS = {
  primaryContainer: '#4f46e5',
  primary: '#c3c0ff',
  onPrimaryContainer: '#ffffff',
  secondary: '#4edea3',
  tertiary: '#ffb695',
  onSurface: '#e5e1e4',
  onSurfaceVariant: '#c7c4d8',
  surface: '#131315',
  glassBg: 'rgba(24, 24, 28, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

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
    backgroundColor: ADMIN_COLORS.glassBg,
    borderRadius: 16,
    borderWidth: 1, borderColor: ADMIN_COLORS.glassBorder,
    padding: 16,
    gap: 4,
  },
  metricLabel: { fontSize: 10, fontWeight: '700', color: ADMIN_COLORS.onSurfaceVariant, fontFamily, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6 },
  metricValue: { fontSize: 24, fontWeight: '700', color: ADMIN_COLORS.onSurface, fontFamily },
  regionStatItem: { flex: 1, gap: 4 },
  regionStatLabel: { fontSize: 10, fontWeight: '700', color: ADMIN_COLORS.onSurfaceVariant, fontFamily, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6 },
  regionStatValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  regionStatValue: { fontSize: 18, fontWeight: '700', color: ADMIN_COLORS.onSurface, fontFamily },
});
