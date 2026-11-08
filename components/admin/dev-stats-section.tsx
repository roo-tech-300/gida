import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, fontFamily } from '@/constants/design';
import { useAppUserCount } from '@/hooks/use-admin-profiles';

function StatPill({
  icon,
  label,
  value,
  isLoading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLoading: boolean;
}) {
  return (
    <View style={styles.pill}>
      <View style={styles.pillIconWrap}>
        <Ionicons name={icon} size={18} color={DesignColors.primary} />
      </View>
      <View style={styles.pillText}>
        <Text style={styles.pillLabel}>{label}</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={DesignColors.primary} style={styles.loader} />
        ) : (
          <Text style={styles.pillValue}>{value}</Text>
        )}
      </View>
    </View>
  );
}

export function DevStatsSection() {
  const { data: userCount, isLoading, isError } = useAppUserCount();

  const displayCount = isError ? 'Error' : String(userCount ?? 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View style={styles.devBadge}>
            <Ionicons name="shield-checkmark-outline" size={10} color={DesignColors.primary} />
            <Text style={styles.devBadgeText}>SUPER ADMIN</Text>
          </View>
          <Text style={styles.title}>App Stats</Text>
        </View>
        <Text style={styles.subtitle}>Only visible to super admins</Text>
      </View>

      <View style={styles.grid}>
        <StatPill
          icon="people-outline"
          label="Total Users"
          value={`${displayCount} ${Number(userCount) === 1 ? 'user' : 'users'}`}
          isLoading={isLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    backgroundColor: DesignColors.primaryTint,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  devBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DesignColors.primaryTintMid,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
  },
  devBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: DesignColors.primary,
    fontFamily,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: DesignColors.onSurface,
    fontFamily,
  },
  subtitle: {
    fontSize: 10,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    opacity: 0.6,
  },
  grid: { gap: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DesignColors.glassBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DesignColors.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pillIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
  },
  pillText: { flex: 1, gap: 2 },
  pillLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  pillValue: {
    fontSize: 20,
    fontWeight: '700',
    color: DesignColors.onSurface,
    fontFamily,
  },
  loader: { alignSelf: 'flex-start', marginTop: 2 },
});
