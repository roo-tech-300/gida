import type { AdminRegion } from '@/types/admin';
import { buildBreadcrumb, buildRegionHierarchy, filterRegionTree, getDescendantIds, type RegionAssignment } from './region-tree';

const westAfrica: AdminRegion = { id: 'wa', name: 'West Africa', parent_region_id: null, path: ['wa'] };
const nigeria: AdminRegion = { id: 'ng', name: 'Nigeria', parent_region_id: 'wa', path: ['wa', 'ng'] };
const lagos: AdminRegion = { id: 'lg', name: 'Lagos', parent_region_id: 'ng', path: ['wa', 'ng', 'lg'] };
const ghana: AdminRegion = { id: 'gh', name: 'Ghana', parent_region_id: null, path: ['gh'] };

const regions: AdminRegion[] = [westAfrica, nigeria, lagos, ghana];

const assignments: RegionAssignment[] = [
  { id: 'a1', role: 'regional_admin', assigned_region_id: 'wa', full_name: 'Amina Bello' },
  { id: 'a2', role: 'regional_admin', assigned_region_id: 'ng', full_name: 'Tunde Okafor' },
  { id: 'a3', role: 'field_admin', assigned_region_id: null, full_name: 'Kofi Mensah' },
];

describe('buildRegionHierarchy', () => {
  it('builds a tree sorted by name and computes KPIs', () => {
    const listingPaths = [
      ['wa', 'ng'],
      ['wa', 'ng', 'lg'],
      ['wa', 'ng', 'lg'],
      ['wa'],
      ['gh'],
    ];

    const hierarchy = buildRegionHierarchy(regions, assignments, listingPaths);

    expect(hierarchy.totalRegions).toBe(4);
    expect(hierarchy.unassignedRegions).toBe(2); // Lagos + Ghana have no regional admin
    expect(hierarchy.roots.map((root) => root.region.id)).toEqual(['gh', 'wa']); // alphabetical

    const westAfricaNode = hierarchy.roots.find((node) => node.region.id === 'wa');
    expect(westAfricaNode?.assignedAdminName).toBe('Amina Bello');
    expect(westAfricaNode?.subRegionCount).toBe(1);
    expect(westAfricaNode?.listingCount).toBe(4); // every listing under its branch

    const nigeriaNode = westAfricaNode?.children.find((node) => node.region.id === 'ng');
    expect(nigeriaNode?.assignedAdminName).toBe('Tunde Okafor');
    expect(nigeriaNode?.listingCount).toBe(3);
  });

  it('handles an empty region tree', () => {
    const hierarchy = buildRegionHierarchy([], [], []);
    expect(hierarchy.roots).toEqual([]);
    expect(hierarchy.totalRegions).toBe(0);
    expect(hierarchy.unassignedRegions).toBe(0);
  });
});

describe('getDescendantIds', () => {
  it('returns the node plus every descendant', () => {
    expect(getDescendantIds(regions, 'wa')).toEqual(new Set(['wa', 'ng', 'lg']));
    expect(getDescendantIds(regions, 'ng')).toEqual(new Set(['ng', 'lg']));
    expect(getDescendantIds(regions, 'gh')).toEqual(new Set(['gh']));
  });
});

describe('buildBreadcrumb', () => {
  it('joins ancestor names excluding the region itself', () => {
    const nameById = new Map(regions.map((region) => [region.id, region.name]));
    expect(buildBreadcrumb(lagos, nameById)).toBe('West Africa › Nigeria');
    expect(buildBreadcrumb(westAfrica, nameById)).toBe('');
  });
});

describe('filterRegionTree', () => {
  it('returns the full tree for an empty query', () => {
    const hierarchy = buildRegionHierarchy(regions, [], []);
    expect(filterRegionTree(hierarchy.roots, '')).toEqual(hierarchy.roots);
  });

  it('keeps matching nodes and their ancestors', () => {
    const hierarchy = buildRegionHierarchy(regions, [], []);
    const filtered = filterRegionTree(hierarchy.roots, 'lagos');
    expect(filtered.map((root) => root.region.name)).toEqual(['West Africa']);
    expect(filtered[0].children[0].children[0].region.name).toBe('Lagos');
  });

  it('drops branches without matches', () => {
    const hierarchy = buildRegionHierarchy(regions, [], []);
    const filtered = filterRegionTree(hierarchy.roots, 'ghana');
    expect(filtered.map((root) => root.region.name)).toEqual(['Ghana']);
  });
});
