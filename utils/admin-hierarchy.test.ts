import type { AdminHierarchyInput } from './admin-hierarchy';
import { deriveSupervisors } from './admin-hierarchy';
import type { AdminRegion } from '@/types/admin';

function member(
  overrides: Partial<AdminHierarchyInput> & { id: string; role: AdminHierarchyInput['role'] },
): AdminHierarchyInput {
  return {
    full_name: 'Test Admin',
    email: null,
    avatar_url: null,
    assigned_region_id: null,
    region_name: null,
    ...overrides,
  };
}

describe('deriveSupervisors', () => {
  const westAfrica: AdminRegion = { id: 'west-africa', name: 'West Africa', parent_region_id: null, path: ['west-africa'] };
  const nigeria: AdminRegion = { id: 'nigeria', name: 'Nigeria', parent_region_id: 'west-africa', path: ['west-africa', 'nigeria'] };
  const lagos: AdminRegion = { id: 'lagos', name: 'Lagos', parent_region_id: 'nigeria', path: ['west-africa', 'nigeria', 'lagos'] };

  const regions: AdminRegion[] = [westAfrica, nigeria, lagos];

  it('leaves a super admin without a supervisor', () => {
    const members = [member({ id: 's1', role: 'super_admin' })];
    const result = deriveSupervisors(members, regions);
    expect(result[0].supervisor_id).toBeNull();
    expect(result[0].supervisor_name).toBeNull();
  });

  it('marks a regional admin of a root region as independent', () => {
    const members = [member({ id: 'wa', role: 'regional_admin', assigned_region_id: 'west-africa' })];
    const result = deriveSupervisors(members, regions);
    expect(result[0].supervisor_id).toBeNull();
  });

  it('assigns the parent regional admin as supervisor for a dependent regional admin', () => {
    const members = [
      member({ id: 'wa', full_name: 'Amina Bello', role: 'regional_admin', assigned_region_id: 'west-africa' }),
      member({ id: 'ng', role: 'regional_admin', assigned_region_id: 'nigeria' }),
    ];
    const result = deriveSupervisors(members, regions);
    expect(result[1].supervisor_id).toBe('wa');
    expect(result[1].supervisor_name).toBe('Amina Bello');
  });

  it('derives a field admin supervisor from the regional admin of the same region', () => {
    const members = [
      member({ id: 'ng', full_name: 'Musa Ibrahim', role: 'regional_admin', assigned_region_id: 'nigeria' }),
      member({ id: 'lag', role: 'field_admin', assigned_region_id: 'lagos' }),
    ];
    const result = deriveSupervisors(members, regions);
    expect(result[1].supervisor_id).toBe('ng');
    expect(result[1].supervisor_name).toBe('Musa Ibrahim');
  });

  it('walks up the region chain when no regional admin heads the same region', () => {
    const members = [
      member({ id: 'wa', full_name: 'Amina Bello', role: 'regional_admin', assigned_region_id: 'west-africa' }),
      member({ id: 'lag', role: 'field_admin', assigned_region_id: 'lagos' }),
    ];
    const result = deriveSupervisors(members, regions);
    expect(result[1].supervisor_id).toBe('wa');
    expect(result[1].supervisor_name).toBe('Amina Bello');
  });

  it('leaves a field admin without a supervisor when no regional admin heads their region', () => {
    const members = [member({ id: 'lag', role: 'field_admin', assigned_region_id: 'lagos' })];
    const result = deriveSupervisors(members, regions);
    expect(result[0].supervisor_id).toBeNull();
  });
});
