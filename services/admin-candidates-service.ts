import { supabase } from '@/lib/supabase';
import type { AdminCandidate, AdminRole } from '@/types/admin';

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
