import { supabase } from '@/lib/supabase';
import type { AdminMember, AdminRegion, AdminRole } from '@/types/admin';
import { deriveSupervisors, type AdminHierarchyInput } from '@/utils/admin-hierarchy';
export { searchAdminCandidates, createAdminProfile } from '@/services/admin-candidates-service';
export type { CreateAdminProfileInput } from '@/services/admin-candidates-service';

export type AdminListing = {
  id: string;
  title: string;
  price_amount: number;
  location_landmark: string;
  city: string;
  primary_image: string | null;
  featured: boolean;
  status: string;
  created_at: string;
};

export async function fetchAdminListings(adminId: string): Promise<AdminListing[]> {
  const { data: adminRow, error: adminError } = await supabase
    .from('admin_profiles')
    .select('role, assigned_region_id')
    .eq('id', adminId)
    .maybeSingle();

  if (adminError || !adminRow) {
    console.error('[AdminService] Failed to load admin profile:', adminError?.message);
    return [];
  }

  let query = supabase
    .from('listings')
    .select('id, title, price_amount, location_landmark, city, primary_image, featured, status, created_at')
    .order('created_at', { ascending: false });

  if (adminRow.role === 'super_admin') {
    // Global visibility: no scope filter.
  } else if (adminRow.role === 'regional_admin' && adminRow.assigned_region_id) {
    query = query.or(`admin_id.eq.${adminId},region_path.cs.{${adminRow.assigned_region_id}}`);
  } else {
    query = query.eq('admin_id', adminId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[AdminService] Failed to fetch admin listings:', error.message);
    return [];
  }
  return data as AdminListing[];
}

type AdminProfileRow = {
  id: string;
  role: AdminRole;
  assigned_region_id: string | null;
  profile: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  region: { name: string } | null;
};

export async function fetchAdminProfile(adminId: string): Promise<AdminMember | null> {
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('id, role, assigned_region_id, profile:profiles(full_name, email, avatar_url)')
    .eq('id', adminId)
    .maybeSingle();

  if (error) {
    console.error('[AdminService] Failed to fetch admin profile:', error.message);
    return null;
  }

  if (!data) {
    console.warn('[AdminService] Admin profile not found (row missing or blocked by RLS):', adminId);
    return null;
  }

  const row = data as unknown as AdminProfileRow;
  return {
    id: row.id,
    full_name: row.profile?.full_name ?? 'Unknown Admin',
    email: row.profile?.email ?? null,
    avatar_url: row.profile?.avatar_url ?? null,
    role: row.role,
    assigned_region_id: row.assigned_region_id,
    region_name: null,
    supervisor_id: null,
    supervisor_name: null,
  };
}

export async function fetchAdminProfiles(): Promise<AdminMember[]> {
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('id, role, assigned_region_id, profile:profiles(full_name, email, avatar_url), region:regions(name)')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[AdminService] Failed to fetch admin profiles:', error.message);
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as AdminProfileRow[];
  const members: AdminHierarchyInput[] = rows.map((row) => ({
    id: row.id,
    full_name: row.profile?.full_name ?? 'Unknown Admin',
    email: row.profile?.email ?? null,
    avatar_url: row.profile?.avatar_url ?? null,
    role: row.role,
    assigned_region_id: row.assigned_region_id,
    region_name: row.region?.name ?? null,
  }));

  const regions = await fetchRegions();
  return deriveSupervisors(members, regions);
}

export async function fetchRegions(): Promise<AdminRegion[]> {
  const { data, error } = await supabase
    .from('regions')
    .select('id, name, parent_region_id, path')
    .order('name', { ascending: true });

  if (error) {
    console.error('[AdminService] Failed to fetch regions:', error.message);
    throw new Error(error.message);
  }

  return (data ?? []) as AdminRegion[];
}

export async function fetchAdminListingsPaginated(page = 1, limit = 50): Promise<AdminListing[]> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('listings')
    .select('id, title, price_amount, location_landmark, city, primary_image, featured, status, created_at')
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data, error } = await query;

  if (error) {
    console.error('[AdminService] Failed to fetch admin listings:', error.message);
    return [];
  }
  return (data ?? []) as AdminListing[];
}

export async function fetchAdminProfilesPaginated(page = 1, limit = 50): Promise<AdminMember[]> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from('admin_profiles')
    .select('id, role, assigned_region_id, profile:profiles(full_name, email, avatar_url), region:regions(name)')
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('[AdminService] Failed to fetch admin profiles:', error.message);
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as AdminProfileRow[];
  const members: AdminHierarchyInput[] = rows.map((row) => ({
    id: row.id,
    full_name: row.profile?.full_name ?? 'Unknown Admin',
    email: row.profile?.email ?? null,
    avatar_url: row.profile?.avatar_url ?? null,
    role: row.role,
    assigned_region_id: row.assigned_region_id,
    region_name: row.region?.name ?? null,
  }));

  const regions = await fetchRegions();
  return deriveSupervisors(members, regions);
}

export async function fetchRegionsPaginated(page = 1, limit = 100): Promise<AdminRegion[]> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from('regions')
    .select('id, name, parent_region_id, path')
    .order('name', { ascending: true })
    .range(from, to);

  if (error) {
    console.error('[AdminService] Failed to fetch regions:', error.message);
    throw new Error(error.message);
  }

  return (data ?? []) as AdminRegion[];
}
