import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAppToast } from '@/components/ui/toast-card';
import { useAuth } from '@/context/auth-context';
import { fetchRegions } from '@/services/adminService';
import {
  assignRegionalAdmin,
  createRegion,
  deleteRegion,
  fetchAdminAssignments,
  fetchListingRegionPaths,
  moveRegion,
  renameRegion,
  type CreateRegionInput,
} from '@/services/regionService';
import { buildRegionHierarchy, findRegionNode, getDescendantIds } from '@/utils/region-tree';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  regional_admin: 'Regional Admin',
  field_admin: 'Field Admin',
};

export function useRegionHierarchy() {
  return useQuery({
    queryKey: ['region-hierarchy'],
    queryFn: async () => {
      const [regions, assignments, listingPaths] = await Promise.all([
        fetchRegions(),
        fetchAdminAssignments(),
        fetchListingRegionPaths(),
      ]);
      return buildRegionHierarchy(regions, assignments, listingPaths);
    },
    staleTime: 30_000,
  });
}

function useRegionMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();

  return useMutation<TResult, Error, TInput>({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['region-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useCreateRegion() {
  return useRegionMutation<CreateRegionInput, { id: string }>((input) => createRegion(input));
}

export function useAssignRegionalAdmin() {
  return useRegionMutation<{ regionId: string; adminId: string }, void>((input) => assignRegionalAdmin(input));
}

export function useRenameRegion() {
  return useRegionMutation<{ regionId: string; name: string }, void>((input) => renameRegion(input));
}

export function useMoveRegion() {
  return useRegionMutation<{ regionId: string; newParentId: string | null }, void>((input) => moveRegion(input));
}

export function useDeleteRegion() {
  return useRegionMutation<{ regionId: string }, void>((input) => deleteRegion(input));
}

export function useRegionActions() {
  const { profile } = useAuth();
  const { showToast } = useAppToast();
  const { data } = useRegionHierarchy();

  const createRegion = useCreateRegion();
  const assignAdmin = useAssignRegionalAdmin();
  const renameRegion = useRenameRegion();
  const moveRegion = useMoveRegion();
  const deleteRegion = useDeleteRegion();

  const [menuRegionId, setMenuRegionId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const nameById = useMemo(() => data?.nameById ?? new Map<string, string>(), [data]);
  const menuNode = useMemo(
    () => (menuRegionId ? findRegionNode(data?.roots ?? [], menuRegionId) : null),
    [data, menuRegionId],
  );

  const adminItems = useMemo(
    () =>
      (data?.assignments ?? [])
        .filter((admin) => admin.role !== 'super_admin')
        .map((admin) => ({
          id: admin.id,
          label: admin.full_name,
          meta: `${ROLE_LABELS[admin.role] ?? admin.role}${admin.assigned_region_id ? ` • ${nameById.get(admin.assigned_region_id) ?? ''}` : ''}`,
        })),
    [data, nameById],
  );

  const editParentItems = useMemo(() => {
    if (!data || !menuNode) return [];
    const blocked = getDescendantIds(data.regions, menuNode.region.id);
    return [
      { id: 'none', label: 'None - Make Root' },
      ...data.regions
        .filter((region) => !blocked.has(region.id))
        .map((region) => ({ id: region.id, label: region.name })),
    ];
  }, [data, menuNode]);

  const currentAdminName = useMemo(() => {
    const admin = (data?.assignments ?? []).find(
      (a) => a.role === 'regional_admin' && a.assigned_region_id === menuRegionId,
    );
    return admin?.full_name ?? null;
  }, [data, menuRegionId]);

  const busy = createRegion.isPending || assignAdmin.isPending || renameRegion.isPending || moveRegion.isPending || deleteRegion.isPending;

  const openCreate = (parentId: string | null) => {
    setCreateParentId(parentId);
    setCreateOpen(true);
  };

  const handleCreate = async (input: { name: string; parentId: string | null; adminId: string | null }) => {
    try {
      const { id } = await createRegion.mutateAsync({ name: input.name, parent_region_id: input.parentId, created_by: profile?.id ?? '' });
      if (input.adminId) {
        await assignAdmin.mutateAsync({ regionId: id, adminId: input.adminId });
      }
      showToast({ message: 'Region created successfully.', type: 'success' });
      setCreateOpen(false);
    } catch (error) {
      console.error('[Regions] Failed to create region:', error);
      showToast({ message: error instanceof Error ? error.message : 'Failed to create region.', type: 'error' });
    }
  };

  const handleAssign = async (adminId: string) => {
    if (!menuRegionId) return;
    try {
      await assignAdmin.mutateAsync({ regionId: menuRegionId, adminId });
      showToast({ message: 'Regional admin assigned.', type: 'success' });
      setAssignOpen(false);
    } catch (error) {
      console.error('[Regions] Failed to assign admin:', error);
      showToast({ message: error instanceof Error ? error.message : 'Failed to assign admin.', type: 'error' });
    }
  };

  const handleEdit = async (input: { name: string; parentId: string | null }) => {
    if (!menuNode) return;
    try {
      if (input.name !== menuNode.region.name) {
        await renameRegion.mutateAsync({ regionId: menuNode.region.id, name: input.name });
      }
      if (input.parentId !== menuNode.region.parent_region_id) {
        await moveRegion.mutateAsync({ regionId: menuNode.region.id, newParentId: input.parentId });
      }
      showToast({ message: 'Region updated.', type: 'success' });
      setEditOpen(false);
    } catch (error) {
      console.error('[Regions] Failed to update region:', error);
      showToast({ message: error instanceof Error ? error.message : 'Failed to update region.', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!menuRegionId) return;
    try {
      await deleteRegion.mutateAsync({ regionId: menuRegionId });
      showToast({ message: 'Region deleted.', type: 'success' });
    } catch (error) {
      console.error('[Regions] Failed to delete region:', error);
      showToast({ message: error instanceof Error ? error.message : 'Failed to delete region.', type: 'error' });
    }
  };

  return {
    data,
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
    closeCreate: () => setCreateOpen(false),
    closeAssign: () => setAssignOpen(false),
    closeEdit: () => setEditOpen(false),
    openAssign: () => setAssignOpen(true),
    openEdit: () => setEditOpen(true),
    handleCreate,
    handleAssign,
    handleEdit,
    handleDelete,
  };
}
