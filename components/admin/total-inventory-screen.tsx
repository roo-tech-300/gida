import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PaginatedFlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, fontFamily } from '@/constants/design';
import { useAdminListingsPaginated } from '@/hooks/use-admin-listings-paginated';
import { InventoryCard } from '@/components/admin/inventory-card';
import type { AdminListing } from '@/types/admin';

type Tab = 'all' | 'available' | 'booked';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Listings' },
  { key: 'available', label: 'Available' },
  { key: 'booked', label: 'Booked' },
];

export function TotalInventoryScreen() {
  const insets = useSafeAreaInsets();
  const { data: adminListings, isLoading, hasNextPage, fetchNextPage } = useAdminListingsPaginated();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const filtered = useMemo(() => {
    if (!adminListings) return [];
    let items = adminListings;
    if (activeTab === 'available') items = items.filter((i) => i.status.toLowerCase() === 'available');
    if (activeTab === 'booked') items = items.filter((i) => i.status.toLowerCase() === 'booked');
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (i) => i.title.toLowerCase().includes(q)
          || i.location_landmark.toLowerCase().includes(q),
      );
    }
    return items;
  }, [activeTab, adminListings, query]);

  const totalCount = adminListings?.length || 0;
  const availableCount = adminListings?.filter((i) => i.status.toLowerCase() === 'available').length || 0;
  const occupancy = totalCount > 0 ? Math.round(((totalCount - availableCount) / totalCount) * 100) : 0;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <BackButton hasBackground />
          <Text style={styles.headerTitle}>Total Inventory</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchNextPage}
            colors={['#4F46E5']}
          >
            <Ionicons name="refresh" size="small" color="#4F46E5" />
          </RefreshControl>
        }>
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
            <PaginatedFlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <InventoryCard listing={item} onPress={() => router.push(`/admin/listing/${item.id}` as any) />}
                onEndReached={fetchNextPage}
                onEndReachedThreshold={0.5}
                ListComponent={<View />}
              />
            </PaginatedFlatList>
          )}
        </ScrollView>

        <Pressable style={[styles.fab, { bottom: insets.bottom + 24 }]} onPress={() => router.push('/admin/create-listing')}>
          <Ionicons name="add" size={28} color={DesignColors.onSurface} />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
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
    borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  metricValue: { fontSize: 20, fontWeight: '800', color: DesignColors.onSurface, fontFamily },
  metricLabel: { fontSize: 12, fontWeight: '700', color: DesignColors.primary, fontFamily, marginTop: 4 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 9999, paddingHorizontal: 16, height: 44,
    backgroundColor: DesignColors.surface,
    borderWidth: 1, borderColor: DesignColors.borderSoft,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily, paddingVertical: 0 },

  tabsRow: { marginBottom: 16 },
  tab: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: DesignColors.glassFill,
    marginRight: 8,
  },
  tabActive: { backgroundColor: DesignColors.primaryContainer },
  tabText: { fontSize: 13, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily },
  tabTextActive: { color: DesignColors.onSurface },

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