import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PaginatedFlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo/router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { SearchBar } from '@/components/ui/search-bar';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, fontFamily } from '@/constants/design';
import { useRegionsPaginated } from '@/hooks/use-regions-paginated';
import { filterRegionTree } from '@/utils/region-tree';
import { RegionKpiCards } from '@/components/admin/region-kpi-cards';
import { RegionTreeNode } from '@/components/admin/region-tree-node';

export function RegionsScreen() {
  const alert = useCustomAlert?.() ?? { visible: false, title: '', message: '', buttons: [], onDismiss: () => {} };
  const insets = useSafeAreaInsets();
  const { data, isLoading, hasNextPage, fetchNextPage } = useRegionsPaginated();
  const [query, setQuery] = useState('');

  const nameById = data?.nameById ?? new Map<string, string>();
  const roots = useMemo(() => filterRegionTree(data?.roots ?? [], query), [data, query]);
  const hasRegions = (data?.roots.length ?? 0) > 0;

  useEffect(() => {
    // Loading toast optional
  }, [isLoading]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SafeKeyboardView style={styles.kav}>
        <View style={styles.header}>
          <BackButton hasBackground />
          <Text style={styles.headerTitle}>Regions</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchNextPage} tintColor={DesignColors.primary} />}
        >
          <RegionKpiCards
            totalRegions={data?.totalRegions ?? null}
            unassignedRegions={data?.unassignedRegions ?? null}
          />

          <SearchBar value={query} onChangeText={setQuery} placeholder="Search regions..." />

          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={DesignColors.primary} />
            </View>
          ) : !hasRegions && roots.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="globe-outline" size={32} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.stateText}>No regions yet.</Text>
            </View>
          ) : roots.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="search-outline" size={32} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.stateText}>No matching regions.</Text>
            </View>
          ) : (
            <PaginatedFlatList
              data={roots}
              keyExtractor={(item) => item.region.id}
              renderItem={({ item }) => (
                <RegionTreeNode
                  key={item.region.id}
                  node={item}
                  nameById={nameById}
                />
              )}
              onEndReached={fetchNextPage}
              onEndReachedThreshold={0.5}
              ListComponent={<View />}
            />
          )}
        </ScrollView>
      </SafeKeyboardView>

      <Pressable style={styles.fab} onPress={() => router.push('/admin/create-region')}>
        <Ionicons name="add" size={28} color={DesignColors.onSurface} />
      </Pressable>

      <CustomAlert visible={alert.visible} title={alert.title} message={alert.message} buttons={alert.buttons} onDismiss={alert.onDismiss} />
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
  content: { paddingHorizontal: 16, paddingBottom: 100, gap: 16 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 80 },
  stateText: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999,
    backgroundColor: DesignColors.primaryContainer,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: DesignColors.surfaceContainerLowest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});