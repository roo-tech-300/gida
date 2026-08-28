import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssignRegionAdminModal } from '@/components/admin/assign-region-admin-modal';
import { CreateRegionModal } from '@/components/admin/create-region-modal';
import { EditRegionModal } from '@/components/admin/edit-region-modal';
import { RegionActionsModal } from '@/components/admin/region-actions-modal';
import { RegionKpiCards } from '@/components/admin/region-kpi-cards';
import { RegionTreeNode } from '@/components/admin/region-tree-node';
import { BackButton } from '@/components/ui/back-button';
import { CustomAlert, useCustomAlert } from '@/components/ui/custom-alert';
import { SearchBar } from '@/components/ui/search-bar';
import { DesignColors, fontFamily } from '@/constants/design';
import { useRegionActions, useRegionHierarchy } from '@/hooks/use-regions-page';
import { filterRegionTree } from '@/utils/region-tree';

export function RegionsScreen() {
  const alert = useCustomAlert();
  const [query, setQuery] = useState('');
  const { data, isLoading, isError, isRefetching, refetch } = useRegionHierarchy();
  const {
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

  const nameById = data?.nameById ?? new Map<string, string>();
  const roots = useMemo(() => filterRegionTree(data?.roots ?? [], query), [data, query]);
  const hasRegions = (data?.roots.length ?? 0) > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <View style={styles.header}>
          <BackButton hasBackground />
          <Text style={styles.headerTitle}>Regions</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={DesignColors.primary} />}
        >
          <RegionKpiCards
            totalRegions={data ? data.totalRegions : null}
            unassignedRegions={data ? data.unassignedRegions : null}
          />

          <SearchBar value={query} onChangeText={setQuery} placeholder="Search regions..." />

          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={DesignColors.primary} />
            </View>
          ) : isError ? (
            <View style={styles.center}>
              <Ionicons name="cloud-offline-outline" size={32} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.stateText}>Could not load regions.</Text>
              <Pressable style={styles.retryBtn} onPress={() => refetch()}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : !hasRegions ? (
            <View style={styles.center}>
              <Ionicons name="globe-outline" size={32} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.stateText}>No regions yet. Create your first region.</Text>
              <Pressable style={styles.retryBtn} onPress={() => openCreate(null)}>
                <Text style={styles.retryText}>Create Region</Text>
              </Pressable>
            </View>
          ) : roots.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="search-outline" size={32} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.stateText}>No matching regions.</Text>
            </View>
          ) : (
            <View style={styles.tree}>
              {roots.map((root) => (
                <RegionTreeNode key={root.region.id} node={root} nameById={nameById} onActions={setMenuRegionId} />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Pressable style={styles.fab} onPress={() => openCreate(null)}>
        <Ionicons name="add" size={28} color={DesignColors.onSurface} />
      </Pressable>

      <RegionActionsModal
        visible={!!menuNode}
        regionName={menuNode?.region.name ?? ''}
        hasChildren={(menuNode?.subRegionCount ?? 0) > 0}
        hasListings={(menuNode?.listingCount ?? 0) > 0}
        onClose={() => setMenuRegionId(null)}
        onAddSubRegion={() => {
          setMenuRegionId(null);
          openCreate(menuNode?.region.id ?? null);
        }}
        onAssignAdmin={openAssign}
        onEdit={openEdit}
        onDelete={() => {
          if (!menuNode) return;
          alert.showAlert({
            title: 'Delete Region',
            message: `Delete "${menuNode.region.name}"? This cannot be undone.`,
            buttons: [
              { label: 'Cancel', style: 'cancel' },
              { label: 'Delete', style: 'destructive', onPress: () => handleDelete() },
            ],
          });
        }}
      />

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

      <CustomAlert visible={alert.visible} title={alert.title} message={alert.message} buttons={alert.buttons} onDismiss={alert.hideAlert} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  kav: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 100, gap: 16 },
  tree: { gap: 2 },
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
