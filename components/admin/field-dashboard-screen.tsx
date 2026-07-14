import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DesignColors, fontFamily } from '@/constants/design';
import { AdminHeader } from '@/components/admin/admin-header';
import { FIELD_ADMIN_MOCK } from '@/dummy/admin-mock';

const TABS = ['Super View', 'State Teams', 'Field Agents'];

const TOOLS = [
  { key: 'onboard', title: 'Onboard\nNew Property', icon: 'add-circle-outline', color: DesignColors.primaryContainer },
  { key: 'allocations', title: 'Manage\nAllocations', icon: 'swap-horizontal-outline', color: '#f59e0b' },
  { key: 'maintenance', title: 'Maintenance\nLogs', icon: 'construct-outline', color: DesignColors.tertiary },
  { key: 'contacts', title: 'Landlord\nContacts', icon: 'call-outline', color: DesignColors.secondary },
];

const SCHEDULE = [
  { time: '09:00 AM', title: 'Property Inspection', sub: 'Zone 4, Plot 12', chip: 'In Progress', chipColor: DesignColors.secondary },
  { time: '11:30 AM', title: 'Landlord Meeting', sub: 'Chief Amadi, Bosso', chip: 'Upcoming', chipColor: DesignColors.tertiary },
  { time: '02:00 PM', title: 'Team Briefing', sub: 'Field Staff Sync', chip: 'Scheduled', chipColor: DesignColors.onSurfaceVariant },
];

export function FieldAdminDashboardScreen() {
  const admin = FIELD_ADMIN_MOCK;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AdminHeader initials="MI" name="Musa Ibrahim" roleLabel="Field Admin" subtitle="BOSSO SECTOR" />

        <View style={styles.tabRow}>
          {TABS.map((t) => (
            <Pressable key={t} style={[styles.tab, t === 'Super View' && styles.tabActive]}>
              <Text style={[styles.tabText, t === 'Super View' && styles.tabTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.metricsRow}>
          <Metric label="My Allocations" value="42" />
          <Metric label="Pending Inspections" value="6" />
          <Metric label="Occupancy Rate" value="96%" />
        </View>

        <View style={styles.toolSection}>
          <Text style={styles.sectionTitle}>Management Toolkit</Text>
          <View style={styles.toolGrid}>
            {TOOLS.map((t) => (
              <Pressable key={t.key} style={styles.toolCard}>
                <View style={[styles.toolIcon, { backgroundColor: `${t.color}20` }]}>
                  <Ionicons name={t.icon as any} size={22} color={t.color} />
                </View>
                <Text style={styles.toolLabel}>{t.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>Field Schedule</Text>
          {SCHEDULE.map((s, i) => (
            <View key={i} style={[styles.scheduleRow, i < SCHEDULE.length - 1 && styles.scheduleBordered]}>
              <Text style={styles.scheduleTime}>{s.time}</Text>
              <View style={styles.scheduleLine} />
              <View style={styles.scheduleContent}>
                <View style={styles.scheduleTop}>
                  <Text style={styles.scheduleTitle}>{s.title}</Text>
                  <View style={[styles.chip, { borderColor: s.chipColor }]}>
                    <Text style={[styles.chipText, { color: s.chipColor }]}>{s.chip}</Text>
                  </View>
                </View>
                <Text style={styles.scheduleSub}>{s.sub}</Text>
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
  safe: { flex: 1, backgroundColor: '#000000' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 100, gap: 24 },
  tabRow: { flexDirection: 'row', backgroundColor: DesignColors.glassBg, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: DesignColors.glassBorder },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: DesignColors.primaryContainer },
  tabText: { fontSize: 12, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily },
  tabTextActive: { color: '#ffffff' },
  metricsRow: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, backgroundColor: DesignColors.glassBg, borderRadius: 16, borderWidth: 1, borderColor: DesignColors.glassBorder, padding: 16, gap: 4 },
  metricLabel: { fontSize: 10, fontWeight: '700', color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6 },
  metricValue: { fontSize: 24, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  toolSection: { gap: 16 },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  toolCard: { width: '47%', height: 112, borderRadius: 16, backgroundColor: DesignColors.glassBg, borderWidth: 1, borderColor: DesignColors.glassBorder, padding: 20, justifyContent: 'space-between' },
  toolIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { fontSize: 12, fontWeight: '700', color: DesignColors.onSurface, fontFamily, letterSpacing: 0.3 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.24 },
  scheduleSection: { backgroundColor: DesignColors.glassBg, borderRadius: 16, borderWidth: 1, borderColor: DesignColors.glassBorder, padding: 16, gap: 16 },
  scheduleRow: { flexDirection: 'row', gap: 12, paddingBottom: 12 },
  scheduleBordered: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  scheduleTime: { fontSize: 12, fontWeight: '700', color: DesignColors.onSurfaceVariant, fontFamily, width: 64 },
  scheduleLine: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  scheduleContent: { flex: 1, gap: 4 },
  scheduleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scheduleTitle: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999, borderWidth: 1 },
  chipText: { fontSize: 9, fontWeight: '700', fontFamily, letterSpacing: 0.5 },
  scheduleSub: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily },
});
