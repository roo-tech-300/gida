import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { InventoryCard } from '@/components/admin/inventory-card';
import { ListScreen } from '@/components/ui/list-screen';
import { SearchBar } from '@/components/ui/search-bar';
import { DesignColors, fontFamily } from '@/constants/design';
import { useAdminListingsPaginated } from '@/hooks/use-admin-listings-paginated';
import type { AdminListing } from '@/services/adminService';

type Tab = 'all' | 'available' | 'booked';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Listings' },
  { key: 'available', label: 'Available' },
  { key: 'booked', label: 'Booked' },
];

export function TotalInventoryScreen() {
  const {
    data: adminListings,
    isLoading,
    isError,
    isRefetching,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
  } = useAdminListingsPaginated();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const listingItems = useMemo(
    () => (adminListings?.pages ?? []).reduce<AdminListing[]>((acc, page) => acc.concat(page), []),
    [adminListings],
  );

  const filtered = useMemo(() => {
    let items = listingItems;
    if (activeTab === 'available') items = items.filter((i) => i.status.toLowerCase() === 'available');
    if (activeTab === 'booked') items = items.filter((i) => i.status.toLowerCase() === 'booked');
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (i) => i.title.toLowerCase().includes(q) || i.location_landmark.toLowerCase().includes(q),
      );
    }
    return items;
  }, [activeTab, listingItems, query]);

  const totalCount = listingItems.length;
  const availableCount = listingItems.filter((i) => i.status.toLowerCase() === 'available').length;
  const occupancy = totalCount > 0 ? Math.round(((totalCount - availableCount) / totalCount) * 100) : 0;
  const hasFilters = query.trim().length > 0 || activeTab !== 'all';

  return (
    <ListScreen<AdminListing>
      title="Total Inventory"
      toolbar={
        <>
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

          <SearchBar value={query} onChangeText={setQuery} placeholder="Search by property or location..." />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      }
      data={filtered}
      keyExtractor={(item) => item.id}
      isLoading={isLoading && listingItems.length === 0}
      isError={isError}
      onRetry={() => void refetch()}
      errorMessage="Could not load inventory."
      emptyMessage={hasFilters ? 'No listings match your filters.' : 'No listings found'}
      emptyIcon={hasFilters ? 'search-outline' : 'home-outline'}
      isRefetching={isRefetching}
      onRefresh={() => void refetch()}
      onEndReached={() => void fetchNextPage()}
      isLoadingMore={isFetchingNextPage}
      contentContainerStyle={styles.content}
      action={{ icon: 'add', onPress: () => router.push('/admin/create-listing') }}
      renderItem={({ item }) => (
        <InventoryCard listing={item} onPress={() => router.push(`/admin/listing/${item.id}`)} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    backgroundColor: DesignColors.surface,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  metricValue: { fontSize: 20, fontWeight: '800', color: DesignColors.onSurface, fontFamily },
  metricLabel: { fontSize: 12, fontWeight: '700', color: DesignColors.primary, fontFamily, marginTop: 4 },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: DesignColors.glassFill,
    marginRight: 8,
  },
  tabActive: { backgroundColor: DesignColors.primaryContainer },
  tabText: { fontSize: 13, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily },
  tabTextActive: { color: DesignColors.onSurface },
});
