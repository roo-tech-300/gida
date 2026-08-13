import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DesignColors, fontFamily } from '@/constants/design';
import { AdminHeader } from '@/components/admin/admin-header';
import { MetricCard } from '@/components/admin/super-admin-helpers';
import { useAdminStats, useRecentAdminActivity } from '@/hooks/use-admin-profiles';
import type { AdminActivity } from '@/services/super-admin-service';
import { useAuth } from '@/context/auth-context';

type ActionItem = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const ACTIONS: ActionItem[] = [
  { key: 'teams', title: 'Teams', icon: 'people-outline' },
  { key: 'inventory', title: 'Inventory', icon: 'map-outline' },
  { key: 'contracts', title: 'Contracts', icon: 'document-text-outline' },
  { key: 'regions', title: 'Regions', icon: 'globe-outline' },
];

const ACTION_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  check_circle: 'checkmark-circle',
  upload_file: 'cloud-upload-outline',
  warning: 'warning-outline',
};

const ACTION_BG_MAP: Record<string, string> = {
  secondary: DesignColors.successContainer,
  primary: DesignColors.primaryTint,
  tertiary: DesignColors.warningContainer,
};

const ACTION_COLOR_MAP: Record<string, string> = {
  secondary: DesignColors.secondary,
  primary: DesignColors.primary,
  tertiary: DesignColors.tertiary,
};

export function SuperAdminDashboardScreen() {
  const { profile } = useAuth();
  const { data: stats } = useAdminStats();
  const { data: activity, isError: activityError } = useRecentAdminActivity();

  const displayName = profile?.full_name?.trim() || 'Super Admin';
  const initials = useMemo(
    () => displayName.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2),
    [displayName],
  );

  const recentActions: AdminActivity[] = activity ?? [];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <AdminHeader initials={initials} name={displayName} roleLabel="Super Admin" subtitle="GLOBAL ACCESS" />

          <View style={styles.metricsRow}>
            <MetricCard label="Total Regions" value={String(stats?.totalRegions ?? '—')} />
            <MetricCard label="Regional Admins" value={String(stats?.regionalAdmins ?? '—')} />
            <MetricCard label="Field Admins" value={String(stats?.fieldAdmins ?? '—')} />
          </View>

          <View style={styles.actionGrid}>
            {ACTIONS.map((action) => (
              <Pressable
                key={action.key}
                style={styles.actionCard}
                onPress={() => {
                  if (action.key === 'teams') router.push('/admin/manage-teams');
                  if (action.key === 'inventory') router.push('/admin/total-inventory');
                  if (action.key === 'contracts') router.push('/admin/landlord-contracts');
                  if (action.key === 'regions') router.push('/admin/regions');
                }}
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name={action.icon} size={22} color={DesignColors.onSurfaceVariant} />
                </View>
                <Text style={styles.actionLabel}>{action.title}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.activitySection}>
            <Text style={styles.activityTitle}>Recent Actions</Text>
            {recentActions.length === 0 ? (
              <Text style={styles.activityEmpty}>
                {activityError ? 'Could not load recent activity.' : 'No recent activity yet.'}
              </Text>
            ) : (
              recentActions.map((act, i) => (
                <View key={act.id} style={[styles.activityRow, i < recentActions.length - 1 && styles.activityRowBordered]}>
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
                  <Ionicons name="chevron-forward" size={16} color={DesignColors.onSurfaceVariant} />
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 100, gap: 24 },
  metricsRow: { flexDirection: 'row', gap: 12 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '47%', height: 128,
    borderRadius: 16,
    backgroundColor: DesignColors.glassBg,
    borderWidth: 1, borderColor: DesignColors.glassBorder,
    padding: 20,
    justifyContent: 'space-between',
  },
  actionIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: DesignColors.borderSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 12, fontWeight: '700', color: DesignColors.onSurface, fontFamily, letterSpacing: 0.3 },

  activitySection: {
    backgroundColor: DesignColors.glassBg,
    borderRadius: 16,
    borderWidth: 1, borderColor: DesignColors.glassBorder,
    padding: 16,
    gap: 12,
  },
  activityTitle: { fontSize: 12, fontWeight: '700', color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1, textTransform: 'uppercase' },
  activityEmpty: { fontSize: 13, color: DesignColors.onSurfaceVariant, fontFamily, paddingVertical: 8 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  activityRowBordered: { borderBottomWidth: 1, borderBottomColor: DesignColors.borderFaint },
  activityIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  activityText: { flex: 1, gap: 2 },
  activityTitleText: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  activitySub: { fontSize: 10, color: DesignColors.onSurfaceVariant, fontFamily },
});
