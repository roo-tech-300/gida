import type { AdminRegion } from '@/types/admin';

export type RegionAssignment = {
  id: string;
  role: 'super_admin' | 'regional_admin' | 'field_admin';
  assigned_region_id: string | null;
  full_name: string;
};

export type RegionTreeNode = {
  region: AdminRegion;
  children: RegionTreeNode[];
  depth: number;
  assignedAdminName: string | null;
  subRegionCount: number;
  listingCount: number;
};

export type RegionHierarchy = {
  roots: RegionTreeNode[];
  totalRegions: number;
  unassignedRegions: number;
  nameById: Map<string, string>;
  regions: AdminRegion[];
  assignments: RegionAssignment[];
};

export function buildRegionHierarchy(
  regions: AdminRegion[],
  assignments: RegionAssignment[],
  listingPaths: string[][],
): RegionHierarchy {
  const nameById = new Map<string, string>();
  for (const region of regions) nameById.set(region.id, region.name);

  const childrenMap = new Map<string, AdminRegion[]>();
  for (const region of regions) {
    const parentKey = region.parent_region_id ?? '';
    const siblings = childrenMap.get(parentKey) ?? [];
    siblings.push(region);
    childrenMap.set(parentKey, siblings);
  }
  for (const siblings of childrenMap.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name));
  }

  const listingCount = new Map<string, number>();
  for (const path of listingPaths) {
    for (const id of path) {
      if (nameById.has(id)) listingCount.set(id, (listingCount.get(id) ?? 0) + 1);
    }
  }

  const adminByRegion = new Map<string, string>();
  for (const assignment of assignments) {
    if (assignment.assigned_region_id && assignment.role === 'regional_admin') {
      adminByRegion.set(assignment.assigned_region_id, assignment.full_name);
    }
  }

  function build(region: AdminRegion, depth: number): RegionTreeNode {
    const children = (childrenMap.get(region.id) ?? []).map((child) => build(child, depth + 1));
    return {
      region,
      children,
      depth,
      assignedAdminName: adminByRegion.get(region.id) ?? null,
      subRegionCount: children.length,
      listingCount: listingCount.get(region.id) ?? 0,
    };
  }

  const roots = (childrenMap.get('') ?? []).map((region) => build(region, 0));

  let unassignedRegions = 0;
  for (const region of regions) {
    if (!adminByRegion.has(region.id)) unassignedRegions += 1;
  }

  return {
    roots,
    totalRegions: regions.length,
    unassignedRegions,
    nameById,
    regions,
    assignments,
  };
}

export function getDescendantIds(regions: AdminRegion[], rootId: string): Set<string> {
  const childrenMap = new Map<string, string[]>();
  for (const region of regions) {
    const parentKey = region.parent_region_id ?? '';
    const siblings = childrenMap.get(parentKey) ?? [];
    siblings.push(region.id);
    childrenMap.set(parentKey, siblings);
  }

  const descendants = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    if (descendants.has(id)) continue;
    descendants.add(id);
    for (const child of childrenMap.get(id) ?? []) stack.push(child);
  }
  return descendants;
}

export function buildBreadcrumb(region: AdminRegion, nameById: Map<string, string>): string {
  return region.path
    .slice(0, -1)
    .map((id) => nameById.get(id))
    .filter((name): name is string => !!name)
    .join(' › ');
}

export function findRegionNode(roots: RegionTreeNode[], id: string): RegionTreeNode | null {
  for (const root of roots) {
    if (root.region.id === id) return root;
    const found = findRegionNode(root.children, id);
    if (found) return found;
  }
  return null;
}

export function filterRegionTree(roots: RegionTreeNode[], query: string): RegionTreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return roots;

  const filter = (node: RegionTreeNode): RegionTreeNode | null => {
    const children = node.children
      .map(filter)
      .filter((child): child is RegionTreeNode => child !== null);
    if (node.region.name.toLowerCase().includes(q) || children.length > 0) {
      return { ...node, children };
    }
    return null;
  };

  return roots
    .map(filter)
    .filter((node): node is RegionTreeNode => node !== null);
}
