import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { SearchBar } from '@/components/ui/search-bar';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { DesignColors, fontFamily } from '@/constants/design';
import { filterRegionTree } from '@/utils/region-tree';
import { RegionKpiCards } from '@/components/admin/region-kpi-cards';
import { RegionTreeNode } from '@/components/admin/region-tree-node';
import { AssignRegionAdminModal } from '@/components/admin/assign-region-admin-modal';
import { CreateRegionModal } from '@/components/admin/create-region-modal';
import { EditRegionModal } from '@/components/admin/edit-region-modal';
import { RegionActionsModal } from '@/components/admin/region-actions-modal';
import { PaginatedFlatList } from '@/components/ui/paginated-flat-list';
import { useRegionActions } from '@/hooks/use-regions-page';

export function RegionsScreen() {
  const {
    data,
    isRefetching,
    refetch,
    menuRegionId,
    menuNode,
    adminItems,
    editParentItems,
    currentAdminName,
    busy,
    createOpen,
    createParentId,
    assignOpen,
    editOpen,
    setMenuRegionId,
    openCreate,
    closeCreate,
    closeAssign,
    closeEdit,
    openAssign,
    openEdit,
    handleCreate,
    handleAssign,
    handleEdit,
    handleDelete,
  } = useRegionActions();

  const [query, setQuery] = useState('');

  const nameById = useMemo(() => data?.nameById ?? new Map<string, string>(), [data]);
  const roots = useMemo(() => filterRegionTree(data?.roots ?? [], query), [data, query]);
  const hasRegions = (data?.roots.length ?? 0) > 0;
  const isLoading = !data;
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SafeKeyboardView style={styles.kav}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={DesignColors.primary} />}
        >
          <View style={styles.header}>
            <BackButton hasBackground />
            <Text style={styles.headerTitle}>Regions</Text>
          </View>

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
                  onActions={setMenuRegionId}
                />
              )}
            />
          )}
        </ScrollView>
      </SafeKeyboardView>

      <Pressable style={styles.fab} onPress={() => openCreate(null)}>
        <Ionicons name="add" size={28} color={DesignColors.onSurface} />
      </Pressable>

      <CreateRegionModal
        visible={createOpen}
        initialParentId={createParentId}
        regions={data?.regions ?? []}
        adminItems={adminItems}
        isPending={busy}
        onClose={closeCreate}
        onConfirm={handleCreate}
      />

      <AssignRegionAdminModal
        visible={assignOpen}
        regionName={menuNode?.region.name ?? ''}
        currentAdminName={currentAdminName}
        adminItems={adminItems}
        isPending={busy}
        onClose={closeAssign}
        onConfirm={handleAssign}
      />

      <EditRegionModal
        visible={editOpen}
        regionName={menuNode?.region.name ?? ''}
        initialParentId={menuNode?.region.parent_region_id ?? null}
        parentItems={editParentItems}
        isPending={busy}
        onClose={closeEdit}
        onConfirm={handleEdit}
      />

      <RegionActionsModal
        visible={menuRegionId !== null}
        regionName={menuNode?.region.name ?? ''}
        hasChildren={(menuNode?.children.length ?? 0) > 0}
        hasListings={(menuNode?.listingCount ?? 0) > 0}
        onClose={() => setMenuRegionId(null)}
        onAddSubRegion={() => openCreate(menuRegionId)}
        onAssignAdmin={openAssign}
        onEdit={openEdit}
        onDelete={() => {
          void handleDelete();
          setMenuRegionId(null);
        }}
      />
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