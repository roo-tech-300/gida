import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AssignRegionAdminModal } from '@/components/admin/assign-region-admin-modal';
import { CreateRegionModal } from '@/components/admin/create-region-modal';
import { EditRegionModal } from '@/components/admin/edit-region-modal';
import { RegionActionsModal } from '@/components/admin/region-actions-modal';
import { RegionKpiCards } from '@/components/admin/region-kpi-cards';
import { RegionTreeNode } from '@/components/admin/region-tree-node';
import { ListScreen } from '@/components/ui/list-screen';
import { SearchBar } from '@/components/ui/search-bar';
import { useRegionActions } from '@/hooks/use-regions-page';
import { filterRegionTree } from '@/utils/region-tree';

export function RegionsScreen() {
  const {
    data,
    isError,
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

  return (
    <ListScreen
      title="Regions"
      toolbar={
        <>
          <RegionKpiCards
            totalRegions={data?.totalRegions ?? null}
            unassignedRegions={data?.unassignedRegions ?? null}
          />
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search regions..." />
        </>
      }
      data={roots}
      keyExtractor={(item) => item.region.id}
      isLoading={!data}
      isError={isError}
      onRetry={() => void refetch()}
      errorMessage="Could not load regions."
      emptyMessage={hasRegions ? 'No matching regions.' : 'No regions yet.'}
      emptyIcon={hasRegions ? 'search-outline' : 'globe-outline'}
      isRefetching={isRefetching}
      onRefresh={() => void refetch()}
      contentContainerStyle={styles.content}
      action={{ icon: 'add', onPress: () => openCreate(null) }}
      renderItem={({ item }) => (
        <RegionTreeNode key={item.region.id} node={item} nameById={nameById} onActions={setMenuRegionId} />
      )}
    >
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
    </ListScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
});
