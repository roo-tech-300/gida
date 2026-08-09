import type { AdminMember, AdminRegion, AdminRole } from '@/types/admin';

export type AdminHierarchyInput = {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  role: AdminRole;
  assigned_region_id: string | null;
  region_name: string | null;
};

export function deriveSupervisors(
  members: AdminHierarchyInput[],
  regions: AdminRegion[],
): AdminMember[] {
  const regionById = new Map(regions.map((region) => [region.id, region]));
  const regionalByRegion = new Map<string, AdminHierarchyInput>();

  for (const member of members) {
    if (member.role === 'regional_admin' && member.assigned_region_id) {
      regionalByRegion.set(member.assigned_region_id, member);
    }
  }

  return members.map((member) => {
    let supervisor: AdminHierarchyInput | undefined;

    if (member.role === 'field_admin' && member.assigned_region_id) {
      supervisor = regionalByRegion.get(member.assigned_region_id);
    } else if (member.role === 'regional_admin' && member.assigned_region_id) {
      const parentId = regionById.get(member.assigned_region_id)?.parent_region_id ?? null;
      supervisor = parentId ? regionalByRegion.get(parentId) : undefined;
    }

    return {
      ...member,
      supervisor_id: supervisor?.id ?? null,
      supervisor_name: supervisor?.full_name ?? null,
    };
  });
}
