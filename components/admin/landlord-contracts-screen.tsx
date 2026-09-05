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
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, fontFamily } from '@/constants/design';
import { useLandlordsPaginated } from '@/hooks/use-landlords-paginated';
import { getInitials } from '@/utils/get-initials';
import { LandlordProfileModal } from '@/components/admin/landlord-profile-modal';
import { useAppToast } from '@/components/ui/toast-card';

export function LandlordContractsScreen() {
  const insets = useSafeAreaInsets();
  const { data: landlords, isLoading, hasNextPage, fetchNextPage } = useLandlordsPaginated();
  const [query, setQuery] = useState('');

  useEffect(() => {
    // loading toast optional
  }, [isLoading]);

  const filtered = useMemo(() => {
    if (!landlords) return [];
    if (!query.trim()) return landlords;
    const q = query.toLowerCase();
    return landlords.filter(
      (l) => l.full_name.toLowerCase().includes(q) || (l.email ?? '').toLowerCase().includes(q),
    );
  }, [query, landlords]);

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
              renderItem={(item) => (
                <Pressable key={item.id} style={styles.landlordCard} onPress={() => router.push(`/admin/landlord-properties/${item.id}` as any)}>
                  <View style={styles.cardLeft}>
                    <Pressable style={styles.avatar} hitSlop={6} onPress={(e) => {
                      e.stopPropagation();
                    }}>
                      <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
                    </Pressable>
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
              ListComponent={<View />}
            />
          )}
        </ScrollView>
      </SafeKeyboardView>

      <Pressable style={[styles.fab, { bottom: insets.bottom + 24 }]} onPress={() => router.push('/admin/create-landlord')}>
        <Ionicons name="add" size={24} color={DesignColors.onSurface} />
        <Text style={styles.fabLabel}>Add Landlord</Text>
      </Pressable>

      <LandlordProfileModal visible={false} landlord={{}} onClose={() => {}} />
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