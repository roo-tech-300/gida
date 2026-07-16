import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, fontFamily } from '@/constants/design';
import { useListings } from '@/hooks/use-listings';
import { InventoryCard } from '@/components/admin/inventory-card';
import type { FeedListing } from '@/types/feed-listing';

type Tab = 'all' | 'available' | 'booked';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Listings' },
  { key: 'available', label: 'Available' },
  { key: 'booked', label: 'Booked' },
];

export function TotalInventoryScreen() {
  const insets = useSafeAreaInsets();
  const { data: listings, isLoading } = useListings();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const filtered = useMemo(() => {
    if (!listings) return [];
    let items = listings;
    if (activeTab === 'available') items = items.filter((i) => i.status.toLowerCase() === 'available');
    if (activeTab === 'booked') items = items.filter((i) => i.status.toLowerCase() === 'booked');
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (i) => i.title.toLowerCase().includes(q)
          || i.location.toLowerCase().includes(q),
      );
    }
    return items;
  }, [activeTab, listings, query]);

  const totalCount = listings?.length || 0;
  const availableCount = listings?.filter((i) => i.status.toLowerCase() === 'available').length || 0;
  const occupancy = totalCount > 0 ? Math.round(((totalCount - availableCount) / totalCount) * 100) : 0;

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
              <Text style={styles.metricValue}>{totalCount.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Total Listings</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{occupancy}%</Text>
              <Text style={styles.metricLabel}>Occupancy</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{availableCount}</Text>
              <Text style={styles.metricLabel}>Available</Text>
            </View>
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={DesignColors.onSurfaceVariant} style={{ opacity: 0.5 }} />
            <TextInput
              placeholder="Search by property or location..."
              placeholderTextColor={DesignColors.onSurfaceVariant}
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

          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={DesignColors.primary} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No listings found</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filtered.map((item) => (
                <InventoryCard key={item.id} listing={item} />
              ))}
            </View>
          )}
        </ScrollView>

        <Pressable style={[styles.fab, { bottom: insets.bottom + 24 }]} onPress={() => router.push('/admin/create-listing')}>
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: DesignColors.onSurface, fontFamily },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 100 },

  metricsRow: { flexDirection: 'row', gap: 10, paddingBottom: 24 },
  metricCard: {
    flex: 1, borderRadius: 16, padding: 14,
    backgroundColor: DesignColors.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#ffffff', fontFamily },
  metricLabel: { fontSize: 12, fontWeight: '700', color: DesignColors.primary, fontFamily, marginTop: 4 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 9999, paddingHorizontal: 16, height: 44,
    backgroundColor: DesignColors.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily, paddingVertical: 0 },

  tabsRow: { marginBottom: 16 },
  tab: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(26,26,30,0.82)',
    marginRight: 8,
  },
  tabActive: { backgroundColor: DesignColors.primaryContainer },
  tabText: { fontSize: 13, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily },
  tabTextActive: { color: '#ffffff' },

  list: { gap: 16 },

  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyText: { fontSize: 14, color: DesignColors.onSurfaceVariant, fontFamily },

  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
});