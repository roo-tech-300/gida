import { supabase } from '@/lib/supabase';
import type { AdminRole } from '@/types/admin';
import type { RegionAssignment } from '@/utils/region-tree';

export type ListingRegionPathRow = {
  id: string;
  region_path: string[] | null;
};

export async function fetchAdminAssignments(): Promise<RegionAssignment[]> {
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('id, role, assigned_region_id, profile:profiles(full_name)');

  if (error) {
    console.error('[RegionService] Failed to fetch admin assignments:', error.message);
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as {
    id: string;
    role: AdminRole;
    assigned_region_id: string | null;
    profile: { full_name: string | null } | null;
  }[];

  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    assigned_region_id: row.assigned_region_id,
    full_name: row.profile?.full_name ?? 'Unknown Admin',
  }));
}

export type RegionRow = {
  id: string;
  name: string;
  path: string[] | null;
  parent_region_id: string | null;
};

export async function fetchRegions(): Promise<RegionRow[]> {
  const { data, error } = await supabase.from('regions').select('id, name, path, parent_region_id').order('name');

  if (error) {
    console.error('[RegionService] Failed to fetch regions:', error.message);
    throw new Error(error.message);
  }

  return (data ?? []) as RegionRow[];
}

export async function fetchListingRegionPaths(): Promise<string[][]> {
  const { data, error } = await supabase.from('listings').select('id, region_path');

  if (error) {
    console.error('[RegionService] Failed to fetch listing region paths:', error.message);
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => (row as ListingRegionPathRow).region_path ?? [])
    .filter((path) => path.length > 0);
}

export type CreateRegionInput = {
  name: string;
  parent_region_id: string | null;
  created_by: string;
};

export async function createRegion(input: CreateRegionInput): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('regions')
    .insert({ name: input.name.trim(), parent_region_id: input.parent_region_id, created_by: input.created_by })
    .select('id')
    .single();

  if (error) {
    console.error('[RegionService] Failed to create region:', error.message);
    throw new Error(error.message);
  }
  return { id: data.id as string };
}

export async function assignRegionalAdmin(input: { regionId: string; adminId: string }): Promise<void> {
  const { error: unassignError } = await supabase
    .from('admin_profiles')
    .update({ assigned_region_id: null })
    .eq('assigned_region_id', input.regionId);

  if (unassignError) {
    console.error('[RegionService] Failed to release previous admin:', unassignError.message);
    throw new Error(unassignError.message);
  }

  const { error: assignError } = await supabase
    .from('admin_profiles')
    .update({ role: 'regional_admin', assigned_region_id: input.regionId })
    .eq('id', input.adminId);

  if (assignError) {
    console.error('[RegionService] Failed to assign admin:', assignError.message);
    throw new Error(assignError.message);
  }
}

export async function renameRegion(input: { regionId: string; name: string }): Promise<void> {
  const { error } = await supabase
    .from('regions')
    .update({ name: input.name.trim() })
    .eq('id', input.regionId);

  if (error) {
    console.error('[RegionService] Failed to rename region:', error.message);
    throw new Error(error.message);
  }
}

export async function moveRegion(input: { regionId: string; newParentId: string | null }): Promise<void> {
  const { error } = await supabase
    .from('regions')
    .update({ parent_region_id: input.newParentId })
    .eq('id', input.regionId);

  if (error) {
    console.error('[RegionService] Failed to move region:', error.message);
    throw new Error(error.message);
  }

  const { error: rpcError } = await supabase.rpc('refresh_region_hierarchy');
  if (rpcError) {
    console.error('[RegionService] Failed to refresh region hierarchy:', rpcError.message);
    throw new Error(rpcError.message);
  }
}

export async function deleteRegion(input: { regionId: string }): Promise<void> {
  const { count: childCount, error: childError } = await supabase
    .from('regions')
    .select('id', { count: 'exact', head: true })
    .eq('parent_region_id', input.regionId);

  if (childError) {
    console.error('[RegionService] Failed to check sub-regions:', childError.message);
    throw new Error(childError.message);
  }
  if ((childCount ?? 0) > 0) {
    throw new Error(`Cannot delete: this region still has ${childCount} sub-region${childCount === 1 ? '' : 's'}.`);
  }

  const { count: listingCount, error: listingError } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .contains('region_path', [input.regionId]);

  if (listingError) {
    console.error('[RegionService] Failed to check listings:', listingError.message);
    throw new Error(listingError.message);
  }
  if ((listingCount ?? 0) > 0) {
    throw new Error(`Cannot delete: ${listingCount} listing${listingCount === 1 ? ' is' : 's are'} still attached.`);
  }

  const { error } = await supabase.from('regions').delete().eq('id', input.regionId);
  if (error) {
    console.error('[RegionService] Failed to delete region:', error.message);
    throw new Error(error.message);
  }
}
