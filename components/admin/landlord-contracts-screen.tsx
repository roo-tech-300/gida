import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { LandlordProfileModal } from '@/components/admin/landlord-profile-modal';
import { ListScreen } from '@/components/ui/list-screen';
import { SearchBar } from '@/components/ui/search-bar';
import { DesignColors, fontFamily } from '@/constants/design';
import { useLandlordsPaginated } from '@/hooks/use-landlords-paginated';
import type { LandlordWithCount } from '@/services/landlord-service';
import { getInitials } from '@/utils/get-initials';

export function LandlordContractsScreen() {
  const router = useRouter();
  const {
    data: landlords,
    isLoading,
    isError,
    isRefetching,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
  } = useLandlordsPaginated();
  const [query, setQuery] = useState('');

  const landlordItems = useMemo(
    () => (landlords?.pages ?? []).reduce<LandlordWithCount[]>((acc, page) => acc.concat(page), []),
    [landlords],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return landlordItems;
    const q = query.toLowerCase();
    return landlordItems.filter(
      (l) => l.full_name.toLowerCase().includes(q) || (l.email ?? '').toLowerCase().includes(q),
    );
  }, [query, landlordItems]);

  return (
    <ListScreen<LandlordWithCount>
      title="Landlords"
      toolbar={<SearchBar value={query} onChangeText={setQuery} placeholder="Search landlord..." />}
      data={filtered}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => void refetch()}
      errorMessage="Could not load landlords."
      emptyMessage={query ? 'No landlords match your search' : 'No landlords yet'}
      isRefetching={isRefetching}
      onRefresh={() => void refetch()}
      onEndReached={() => void fetchNextPage()}
      isLoadingMore={isFetchingNextPage}
      contentContainerStyle={styles.content}
      action={{ label: 'Add Landlord', icon: 'add', onPress: () => router.push('/admin/create-landlord') }}
      renderItem={({ item }) => (
        <Pressable
          style={styles.landlordCard}
          onPress={() => router.push(`/admin/landlord-properties/${item.id}`)}
        >
          <View style={styles.cardLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.landlordName}>{item.full_name}</Text>
              <Text style={styles.landlordEmail}>{item.email ?? ''}</Text>
              <Text style={styles.propertyText}>{item.listings.count} Properties</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={DesignColors.onSurfaceVariant} style={styles.chevron} />
        </Pressable>
      )}
    >
      <LandlordProfileModal visible={false} landlord={null} onClose={() => {}} />
    </ListScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  landlordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 12,
    padding: 14,
    backgroundColor: DesignColors.surface,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: DesignColors.primary, fontFamily },
  cardInfo: { flex: 1, gap: 2 },
  landlordName: { fontSize: 15, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  landlordEmail: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily },
  propertyText: { fontSize: 12, fontWeight: '600', color: DesignColors.primary, fontFamily, marginTop: 2 },
  chevron: { opacity: 0.4 },
});
