import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, fontFamily } from '@/constants/design';
import { useLandlordsPaginated } from '@/hooks/use-landlords-paginated';
import { getInitials } from '@/utils/get-initials';
import { LandlordProfileModal } from '@/components/admin/landlord-profile-modal';
import { PaginatedFlatList } from '@/components/ui/paginated-flat-list';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import type { LandlordWithCount } from '@/services/landlord-service';

export function LandlordContractsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: landlords, isLoading, fetchNextPage } = useLandlordsPaginated();
  const [query, setQuery] = useState('');

  useEffect(() => {
    // loading toast optional
  }, [isLoading]);

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
    <SafeAreaView style={styles.root} edges={['top']}>
      <SafeKeyboardView style={styles.kav}>
        <View style={styles.header}>
          <BackButton hasBackground />
          <Text style={styles.headerTitle}>Landlords</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchNextPage} tintColor={DesignColors.primary} />}
        >
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={DesignColors.onSurfaceVariant} style={{ opacity: 0.5 }} />
            <TextInput
              placeholder="Search landlord..."
              placeholderTextColor={DesignColors.onSurfaceVariant}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={DesignColors.primary} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>{query ? 'No landlords match your search' : 'No landlords yet'}</Text>
            </View>
          ) : (
            <PaginatedFlatList
              data={filtered}
              keyExtractor={(item) => item.id}
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
                  <Ionicons name="chevron-forward" size={16} color={DesignColors.onSurfaceVariant} style={{ opacity: 0.4 }} />
                </Pressable>
              )}
              onEndReached={fetchNextPage}
              onEndReachedThreshold={0.5}
            />
          )}
        </ScrollView>
      </SafeKeyboardView>

      <Pressable style={[styles.fab, { bottom: insets.bottom + 24 }]} onPress={() => router.push('/admin/create-landlord')}>
        <Ionicons name="add" size={24} color={DesignColors.onSurface} />
        <Text style={styles.fabLabel}>Add Landlord</Text>
      </Pressable>

      <LandlordProfileModal visible={false} landlord={null} onClose={() => {}} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  kav: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DesignColors.onSurface, fontFamily },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 120 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 9999, paddingHorizontal: 16, height: 44,
    backgroundColor: DesignColors.surface,
    borderWidth: 1, borderColor: DesignColors.borderSoft,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily, paddingVertical: 0 },

  landlordCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    borderRadius: 12, padding: 14,
    backgroundColor: DesignColors.surface,
    borderWidth: 1, borderColor: DesignColors.borderSoft,
    marginBottom: 12,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: DesignColors.primary, fontFamily },
  cardInfo: { flex: 1, gap: 2 },
  landlordName: { fontSize: 15, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  landlordEmail: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily },
  propertyText: { fontSize: 12, fontWeight: '600', color: DesignColors.primary, fontFamily, marginTop: 2 },

  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 14, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },

  fab: {
    position: 'absolute', left: 16, right: 16,
    height: 52, borderRadius: 26,
    backgroundColor: DesignColors.primaryContainer,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  fabLabel: { fontSize: 14, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
});