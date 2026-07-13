import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { BackButton } from '@/components/ui/back-button';
import { fontFamily } from '@/constants/design';
import { INVENTORY } from '@/dummy/admin-mock';

const C = {
  primary: '#c3c0ff',
  primaryContainer: '#4f46e5',
  onSurface: '#e5e1e4',
  onSurfaceVariant: '#c7c4d8',
  surface: '#131315',
  surfaceLowest: '#0e0e10',
};

type Tab = 'all' | 'available' | 'booked';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Listings' },
  { key: 'available', label: 'Available Beds' },
  { key: 'booked', label: 'Fully Booked' },
];

export function TotalInventoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const filtered = useMemo(() => {
    let items = INVENTORY;
    if (activeTab === 'available') items = items.filter((i) => i.bedsFilled < i.totalBeds);
    if (activeTab === 'booked') items = items.filter((i) => i.status === 'fully_booked');
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (i) => i.name.toLowerCase().includes(q)
          || i.location.toLowerCase().includes(q)
          || i.region.toLowerCase().includes(q)
          || i.manager.toLowerCase().includes(q),
      );
    }
    return items;
  }, [activeTab, query]);

  const totalBeds = INVENTORY.reduce((s, i) => s + i.totalBeds, 0);
  const filledBeds = INVENTORY.reduce((s, i) => s + i.bedsFilled, 0);
  const occupancy = ((filledBeds / totalBeds) * 100).toFixed(1);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <BackButton hasBackground />
          <Text style={styles.headerTitle}>Total Inventory</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>1,240</Text>
              <Text style={styles.metricLabel}>Total Spaces</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{occupancy}%</Text>
              <Text style={styles.metricLabel}>Occupancy</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>196</Text>
              <Text style={styles.metricLabel}>Live Vacant</Text>
            </View>
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={C.onSurfaceVariant} style={{ opacity: 0.5 }} />
            <TextInput
              placeholder="Search by property, region, or admin..."
              placeholderTextColor={C.onSurfaceVariant}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
            {TABS.map((tab) => (
              <Pressable
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.list}>
            {filtered.map((item) => (
              <Pressable key={item.id} style={styles.propertyCard}>
                <View style={styles.propertyTop}>
                  <Text style={styles.propertyName}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={18} color={C.onSurfaceVariant} style={{ opacity: 0.4 }} />
                </View>
                <Text style={styles.propertyLocation}>{item.location} • {item.layout}</Text>

                <View style={styles.managerRow}>
                  <Ionicons
                    name={item.status === 'inactive' ? 'ellipse-outline' : 'person-outline'}
                    size={14}
                    color={C.primary}
                  />
                  <Text style={styles.managerText}>
                    {item.status === 'inactive' ? 'Unassigned' : `Managed by: ${item.manager} (${item.managerLabel})`}
                  </Text>
                </View>

                <View style={styles.bedRow}>
                  <View style={styles.bedBar}>
                    <View style={[styles.bedFill, { width: `${(item.bedsFilled / item.totalBeds) * 100}%` }]} />
                  </View>
                  <View style={[styles.bedChip, item.status === 'fully_booked' && styles.bedChipBooked, item.status === 'inactive' && styles.bedChipInactive]}>
                    <Text style={[styles.bedChipText, item.status === 'fully_booked' && styles.bedChipTextBooked, item.status === 'inactive' && styles.bedChipTextInactive]}>
                      {item.status === 'fully_booked' ? 'Full' : item.status === 'inactive' ? `${item.bedsFilled}/${item.totalBeds}` : `${item.bedsFilled}/${item.totalBeds}`}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Pressable style={[styles.fab, { bottom: insets.bottom + 24 }]}>
          <Ionicons name="add" size={28} color="#ffffff" />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.onSurface, fontFamily },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 100 },

  metricsRow: { flexDirection: 'row', gap: 10, paddingBottom: 24 },
  metricCard: {
    flex: 1, borderRadius: 16, padding: 14,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#ffffff', fontFamily },
  metricLabel: { fontSize: 12, fontWeight: '700', color: C.primary, fontFamily, marginTop: 4 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 9999, paddingHorizontal: 16, height: 44,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: C.onSurface, fontFamily, paddingVertical: 0 },

  tabsRow: { marginBottom: 16 },
  tab: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(26,26,30,0.82)',
    marginRight: 8,
  },
  tabActive: { backgroundColor: C.primaryContainer },
  tabText: { fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant, fontFamily },
  tabTextActive: { color: '#ffffff' },

  list: { gap: 12 },
  propertyCard: {
    borderRadius: 24, padding: 16,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  propertyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  propertyName: { fontSize: 15, fontWeight: '700', color: C.onSurface, fontFamily },
  propertyLocation: { fontSize: 12, fontWeight: '600', color: C.onSurfaceVariant, fontFamily, marginTop: 4, opacity: 0.7 },
  managerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  managerText: { fontSize: 12, fontWeight: '600', color: C.primary, fontFamily, opacity: 0.8 },
  bedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  bedBar: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bedFill: { height: 6, borderRadius: 3, backgroundColor: C.primary },
  bedChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(195,192,255,0.1)',
  },
  bedChipBooked: { backgroundColor: 'rgba(78,222,163,0.12)' },
  bedChipInactive: { backgroundColor: 'rgba(255,255,255,0.06)' },
  bedChipText: { fontSize: 11, fontWeight: '700', color: C.primary, fontFamily, letterSpacing: -0.2 },
  bedChipTextBooked: { color: '#4edea3' },
  bedChipTextInactive: { color: C.onSurfaceVariant, opacity: 0.5 },

  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
});
