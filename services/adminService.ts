import { supabase } from '@/lib/supabase';
import type { AdminCandidate, AdminMember, AdminRegion, AdminRole } from '@/types/admin';
import { deriveSupervisors, type AdminHierarchyInput } from '@/utils/admin-hierarchy';

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
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, price_amount, location_landmark, city, primary_image, featured, status, created_at')
    .eq('agent_id', adminId)
    .order('created_at', { ascending: false });

  if (error) return [];
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
    .select('id, name, parent_region_id')
    .order('name', { ascending: true });

  if (error) {
    console.error('[AdminService] Failed to fetch regions:', error.message);
    throw new Error(error.message);
  }

  return (data ?? []) as AdminRegion[];
}

export async function searchAdminCandidates(query: string): Promise<AdminCandidate[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const { data: adminRows, error: adminError } = await supabase
    .from('admin_profiles')
    .select('id');

  if (adminError) {
    console.error('[AdminService] Failed to fetch existing admins:', adminError.message);
    throw new Error(adminError.message);
  }

  const adminIds = (adminRows ?? []).map((row) => row.id as string);

  let queryBuilder = supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .ilike('full_name', `%${trimmed}%`)
    .limit(10);

  if (adminIds.length > 0) {
    queryBuilder = queryBuilder.not('id', 'in', `(${adminIds.join(',')})`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('[AdminService] Failed to search admin candidates:', error.message);
    throw new Error(error.message);
  }

  return (data ?? []) as AdminCandidate[];
}

export type CreateAdminProfileInput = {
  id: string;
  role: AdminRole;
  assigned_region_id: string | null;
};

export async function createAdminProfile(input: CreateAdminProfileInput): Promise<void> {
  const { error: insertError } = await supabase.from('admin_profiles').insert({
    id: input.id,
    role: input.role,
    assigned_region_id: input.assigned_region_id,
  });

  if (insertError) {
    console.error('[AdminService] Failed to create admin profile:', insertError.message);
    throw new Error(insertError.message);
  }

  const { error: flagError } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', input.id);

  if (flagError) {
    console.error('[AdminService] Failed to flag profile as admin:', flagError.message);
  }
}
