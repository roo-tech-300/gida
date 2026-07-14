import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DesignColors, fontFamily } from '@/constants/design';
import { AdminHeader } from '@/components/admin/admin-header';
import { RECENT_ACTIONS, SUPER_ADMIN_MOCK } from '@/dummy/admin-mock';
import { MetricCard } from '@/components/admin/super-admin-helpers';

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
  secondary: 'rgba(78, 222, 163, 0.15)',
  primary: 'rgba(79, 70, 229, 0.15)',
  tertiary: 'rgba(255, 182, 149, 0.15)',
};

const ACTION_COLOR_MAP: Record<string, string> = {
  secondary: DesignColors.secondary,
  primary: DesignColors.primary,
  tertiary: DesignColors.tertiary,
};

export function SuperAdminDashboardScreen() {
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
            <MetricCard label="Total Regions" value="14" />
            <MetricCard label="Regional Admins" value="42" />
            <MetricCard label="Field Admins" value="512" />
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
                <Ionicons name="chevron-forward" size={16} color={DesignColors.onSurfaceVariant} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
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
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  activityRowBordered: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  activityIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  activityText: { flex: 1, gap: 2 },
  activityTitleText: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  activitySub: { fontSize: 10, color: DesignColors.onSurfaceVariant, fontFamily },
});
