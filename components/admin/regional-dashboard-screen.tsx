import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { DesignColors, fontFamily } from '@/constants/design';
import { AdminHeader } from '@/components/admin/admin-header';
import { useRealtimeTourAlerts } from '@/hooks/use-tour-realtime';

const ACTIONS = [
  { key: 'sub_admins', title: 'Appoint\nSub Admins', icon: 'git-network-outline', primary: true },
  { key: 'field_staff', title: 'Deploy\nField Staff', icon: 'person-add-outline', primary: false },
  { key: 'inventory', title: 'Zone\nInventory', icon: 'storefront-outline', primary: false },
  { key: 'landlords', title: 'Landlord\nAccounts', icon: 'document-text-outline', primary: false },
  { key: 'tours', title: 'Tour\nRequests', icon: 'calendar-outline', primary: false },
];

export function RegionalDashboardScreen() {
  const { unread, clearUnread } = useRealtimeTourAlerts();

  const handleActionPress = (key: string) => {
    if (key === 'tours') {
      clearUnread();
      router.push('/admin/tours');
    }
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AdminHeader initials="JA" name="Johnson Ayuba" roleLabel="State Admin" subtitle="MINNA METRO" />

        <View style={styles.metricsRow}>
          <Metric label="Active Field Staff" value="24" />
          <Metric label="Sub-State Leads" value="5" />
          <Metric label="Zone Inventory" value="1,240" />
        </View>

        <View style={styles.actionGrid}>
          {ACTIONS.map((a) => (
            <Pressable
              key={a.key}
              style={[styles.actionCard, a.primary && styles.actionCardPrimary]}
              onPress={() => handleActionPress(a.key)}
            >
              {a.key === 'tours' && unread > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
              <View style={[styles.actionIcon, a.primary && styles.actionIconPrimary]}>
                <Ionicons name={a.icon as any} size={22} color={a.primary ? DesignColors.onSurface : DesignColors.onSurfaceVariant} />
              </View>
              <Text style={[styles.actionLabel, a.primary && styles.actionLabelPrimary]}>{a.title}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.regionSection}>
          <View style={styles.regionHeader}>
            <Text style={styles.regionTitle}>Active Regional Overview</Text>
            <Pressable><Text style={styles.viewAll}>View All</Text></Pressable>
          </View>
          <View style={styles.mapCard}>
            <View style={styles.mapImage}>
              <View style={styles.mapGradient} />
              <View style={styles.zoomControls}>
                <Pressable style={styles.zoomBtn}><Ionicons name="add" size={18} color={DesignColors.onSurface} /></Pressable>
                <Pressable style={styles.zoomBtn}><Ionicons name="remove" size={18} color={DesignColors.onSurface} /></Pressable>
              </View>
              <View style={styles.mapPill}>
                <View style={styles.mapDot} />
                <Text style={styles.mapPillText}>Zone 1: 70 Active Properties</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.activitySection}>
          <Text style={styles.activityTitle}>Recent Actions</Text>
          {[
            { icon: 'checkmark-circle', color: DesignColors.secondary, bg: DesignColors.successContainer, title: 'Bosso Zone Updated', sub: '2 mins ago • State Admin' },
            { icon: 'person-add', color: DesignColors.primary, bg: DesignColors.primaryTintMid, title: 'New Lead Assigned', sub: '1 hour ago • Minna Metro' },
            { icon: 'warning-outline', color: DesignColors.tertiary, bg: DesignColors.warningContainer, title: 'Pending Field Report', sub: '3 hours ago • Zone 4' },
          ].map((act, i) => (
            <View key={i} style={[styles.activityRow, i < 2 && styles.activityBordered]}>
              <View style={[styles.activityIcon, { backgroundColor: act.bg }]}>
                <Ionicons name={act.icon as any} size={16} color={act.color} />
              </View>
              <View style={styles.activityText}>
                <Text style={styles.activityTitleText}>{act.title}</Text>
                <Text style={styles.activitySub}>{act.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 100, gap: 24 },
  metricsRow: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, backgroundColor: DesignColors.glassBg, borderRadius: 16, borderWidth: 1, borderColor: DesignColors.glassBorder, padding: 16, gap: 4 },
  metricLabel: { fontSize: 10, fontWeight: '700', color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6 },
  metricValue: { fontSize: 24, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', height: 128, borderRadius: 16, backgroundColor: DesignColors.glassBg, borderWidth: 1, borderColor: DesignColors.glassBorder, padding: 20, justifyContent: 'space-between' },
  actionCardPrimary: { backgroundColor: DesignColors.primaryContainer, borderColor: 'transparent' },
  actionBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primary,
  },
  actionBadgeText: { fontSize: 11, fontWeight: '700', color: DesignColors.onPrimary, fontFamily },
  actionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: DesignColors.borderSoft, alignItems: 'center', justifyContent: 'center' },
  actionIconPrimary: { backgroundColor: DesignColors.borderStrong },
  actionLabel: { fontSize: 12, fontWeight: '700', color: DesignColors.onSurface, fontFamily, letterSpacing: 0.3 },
  actionLabelPrimary: { color: DesignColors.onSurface },
  regionSection: { gap: 16 },
  regionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  regionTitle: { fontSize: 20, fontWeight: '700', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.24 },
  viewAll: { fontSize: 12, fontWeight: '600', color: DesignColors.primaryContainer, fontFamily },
  mapCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: DesignColors.glassBorder },
  mapImage: { height: 200, backgroundColor: DesignColors.borderFaint, position: 'relative' },
  mapGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', backgroundColor: DesignColors.scrim },
  zoomControls: { position: 'absolute', top: 12, right: 12, gap: 8 },
  zoomBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: DesignColors.glassBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: DesignColors.glassBorder },
  mapPill: { position: 'absolute', bottom: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: DesignColors.glassBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, borderWidth: 1, borderColor: DesignColors.glassBorder },
  mapDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: DesignColors.secondary },
  mapPillText: { fontSize: 11, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  activitySection: { backgroundColor: DesignColors.glassBg, borderRadius: 16, borderWidth: 1, borderColor: DesignColors.glassBorder, padding: 16, gap: 12 },
  activityTitle: { fontSize: 12, fontWeight: '700', color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1, textTransform: 'uppercase' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  activityBordered: { borderBottomWidth: 1, borderBottomColor: DesignColors.borderFaint },
  activityIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  activityText: { flex: 1, gap: 2 },
  activityTitleText: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  activitySub: { fontSize: 10, color: DesignColors.onSurfaceVariant, fontFamily },
});
