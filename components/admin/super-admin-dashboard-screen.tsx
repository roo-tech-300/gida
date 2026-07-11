import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontFamily } from '@/constants/design';
import { AdminHeader } from '@/components/admin/admin-header';
import { DASHBOARD_STATS, RECENT_ACTIONS, SUPER_ADMIN_MOCK } from '@/dummy/admin-mock';

const ADMIN_COLORS = {
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

type ActionItem = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
};

const ACTIONS: ActionItem[] = [
  { key: 'teams', title: 'Manage Teams', icon: 'people-outline', color: ADMIN_COLORS.onPrimaryContainer, bgColor: ADMIN_COLORS.primaryContainer },
  { key: 'inventory', title: 'Total Inventory', icon: 'map-outline', color: ADMIN_COLORS.onSurface, bgColor: 'transparent' },
  { key: 'contracts', title: 'Landlord Contracts', icon: 'document-text-outline', color: ADMIN_COLORS.onSurface, bgColor: 'transparent' },
  { key: 'tasks', title: 'Field Tasks', icon: 'checkmark-done-outline', color: ADMIN_COLORS.onSurface, bgColor: 'transparent' },
];

const ACTION_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  check_circle: 'checkmark-circle',
  upload_file: 'cloud-upload-outline',
  warning: 'warning-outline',
};

const ACTION_BG_MAP: Record<string, string> = {
  secondary: 'rgba(78, 222, 163, 0.15)',
  primary: 'rgba(79, 70, 229, 0.15)',
  tertiary: 'rgba(255, 182, 149, 0.15)',
};

const ACTION_COLOR_MAP: Record<string, string> = {
  secondary: ADMIN_COLORS.secondary,
  primary: ADMIN_COLORS.primary,
  tertiary: ADMIN_COLORS.tertiary,
};

function IconPill({ name, size = 20, color }: { name: keyof typeof Ionicons.glyphMap; size?: number; color: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function SuperAdminDashboardScreen() {
  const stats = DASHBOARD_STATS;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <AdminHeader initials="EA" name={SUPER_ADMIN_MOCK.full_name} roleLabel="Super Admin" subtitle="GLOBAL ACCESS" />

          <View style={styles.metricsRow}>
            <MetricCard label="Total Regions" value={String(stats.total_regions)} />
            <MetricCard label="State Admins" value={String(stats.state_admins)} />
            <MetricCard label="Field Tasks" value={String(stats.field_tasks)} />
          </View>

          <View style={styles.actionGrid}>
            {ACTIONS.map((action) => (
              <Pressable
                key={action.key}
                style={[styles.actionCard, action.key === 'teams' && styles.actionCardPrimary]}
                onPress={() => {
                  if (action.key === 'teams') router.push('/admin/manage-teams');
                }}
              >
                <View style={[styles.actionIconWrap, action.key === 'teams' && styles.actionIconWrapPrimary]}>
                  <Ionicons
                    name={action.icon}
                    size={22}
                    color={action.key === 'teams' ? ADMIN_COLORS.onPrimaryContainer : ADMIN_COLORS.onSurfaceVariant}
                  />
                </View>
                <Text style={[styles.actionLabel, action.key === 'teams' && styles.actionLabelPrimary]}>
                  {action.title}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.regionSection}>
            <View style={styles.regionHeader}>
              <Text style={styles.regionTitle}>Manage Regions</Text>
              <Pressable>
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            </View>

            <View style={styles.regionCard}>
              <View style={styles.mapPlaceholder}>
                <View style={styles.mapGlow} />
                <Ionicons name="map-outline" size={48} color="rgba(195, 192, 255, 0.3)" />
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>Live Density Map</Text>
                </View>
              </View>

              <View style={styles.regionStats}>
                <RegionStat label="Active Hubs" value={String(stats.active_hubs)} />
                <RegionStat label="Critical" value={String(stats.critical)} color={ADMIN_COLORS.tertiary} icon="alert-circle" />
                <RegionStat label="Growth" value={stats.growth} color={ADMIN_COLORS.secondary} icon="trending-up" />
              </View>
            </View>
          </View>

          <View style={styles.activitySection}>
            <Text style={styles.activityTitle}>Recent Actions</Text>
            {RECENT_ACTIONS.map((act, i) => (
              <View key={act.id} style={[styles.activityRow, i < RECENT_ACTIONS.length - 1 && styles.activityRowBordered]}>
                <View style={[styles.activityIcon, { backgroundColor: ACTION_BG_MAP[act.color] }]}>
                  <Ionicons
                    name={ACTION_ICON_MAP[act.icon]}
                    size={16}
                    color={ACTION_COLOR_MAP[act.color]}
                  />
                </View>
                <View style={styles.activityText}>
                  <Text style={styles.activityTitleText}>{act.title}</Text>
                  <Text style={styles.activitySub}>{act.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={ADMIN_COLORS.onSurfaceVariant} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function RegionStat({ label, value, color, icon }: { label: string; value: string; color?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.regionStatItem}>
      <Text style={styles.regionStatLabel}>{label}</Text>
      <View style={styles.regionStatValueRow}>
        <Text style={[styles.regionStatValue, color ? { color } : undefined]}>{value}</Text>
        {icon && <Ionicons name={icon} size={14} color={color} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 100, gap: 24 },

  metricsRow: { flexDirection: 'row', gap: 12 },
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

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '47%', height: 128,
    borderRadius: 16,
    backgroundColor: ADMIN_COLORS.glassBg,
    borderWidth: 1, borderColor: ADMIN_COLORS.glassBorder,
    padding: 20,
    justifyContent: 'space-between',
  },
  actionCardPrimary: {
    backgroundColor: ADMIN_COLORS.primaryContainer,
    borderColor: 'transparent',
  },
  actionIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionIconWrapPrimary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionLabel: { fontSize: 12, fontWeight: '700', color: ADMIN_COLORS.onSurface, fontFamily, letterSpacing: 0.3 },
  actionLabelPrimary: { color: ADMIN_COLORS.onPrimaryContainer },

  regionSection: { gap: 16 },
  regionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  regionTitle: { fontSize: 22, fontWeight: '700', color: ADMIN_COLORS.onSurface, fontFamily, letterSpacing: -0.24 },
  viewAll: { fontSize: 12, fontWeight: '600', color: ADMIN_COLORS.primaryContainer, fontFamily, letterSpacing: 0.5 },
  regionCard: {
    backgroundColor: ADMIN_COLORS.glassBg,
    borderRadius: 16,
    borderWidth: 1, borderColor: ADMIN_COLORS.glassBorder,
    padding: 20,
    gap: 24,
  },
  mapPlaceholder: {
    height: 140,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  mapGlow: {
    position: 'absolute', top: '30%', left: '30%', width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
  },
  liveBadge: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1, borderColor: ADMIN_COLORS.glassBorder,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ADMIN_COLORS.secondary },
  liveText: { fontSize: 10, fontWeight: '700', color: ADMIN_COLORS.onSurface, fontFamily, letterSpacing: 0.8, textTransform: 'uppercase' },

  regionStats: { flexDirection: 'row', gap: 16 },
  regionStatItem: { flex: 1, gap: 4 },
  regionStatLabel: { fontSize: 10, fontWeight: '700', color: ADMIN_COLORS.onSurfaceVariant, fontFamily, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6 },
  regionStatValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  regionStatValue: { fontSize: 18, fontWeight: '700', color: ADMIN_COLORS.onSurface, fontFamily },

  activitySection: {
    backgroundColor: ADMIN_COLORS.glassBg,
    borderRadius: 16,
    borderWidth: 1, borderColor: ADMIN_COLORS.glassBorder,
    padding: 16,
    gap: 12,
  },
  activityTitle: { fontSize: 12, fontWeight: '700', color: ADMIN_COLORS.onSurfaceVariant, fontFamily, letterSpacing: 1, textTransform: 'uppercase' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  activityRowBordered: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  activityIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  activityText: { flex: 1, gap: 2 },
  activityTitleText: { fontSize: 14, fontWeight: '600', color: ADMIN_COLORS.onSurface, fontFamily },
  activitySub: { fontSize: 10, color: ADMIN_COLORS.onSurfaceVariant, fontFamily },

});
