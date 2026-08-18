import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, fontFamily } from '@/constants/design';
import { buildBreadcrumb, type RegionTreeNode as TreeNode } from '@/utils/region-tree';

type Props = {
  node: TreeNode;
  nameById: Map<string, string>;
  onActions: (regionId: string) => void;
};

export function RegionTreeNode({ node, nameById, onActions }: Props) {
  const [expanded, setExpanded] = useState(node.depth < 1);
  const breadcrumb = buildBreadcrumb(node.region, nameById);
  const hasChildren = node.children.length > 0;

  return (
    <View>
      <View style={[styles.row, { paddingLeft: 12 + node.depth * 18 }]}>
        <Pressable style={styles.chevron} onPress={() => setExpanded((e) => !e)} disabled={!hasChildren} hitSlop={{ top: 8, bottom: 8 }}>
          {hasChildren ? (
            <Ionicons name="chevron-down" size={16} color={DesignColors.onSurfaceVariant} style={!expanded && styles.chevronClosed} />
          ) : (
            <View style={styles.leafDot} />
          )}
        </Pressable>

        <Pressable style={styles.main} onPress={() => hasChildren && setExpanded((e) => !e)}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>{node.region.name}</Text>
            {breadcrumb ? <Text style={styles.breadcrumb} numberOfLines={1}>{breadcrumb}</Text> : null}
          </View>

          <View style={styles.metaRow}>
            {node.assignedAdminName ? (
              <View style={[styles.badge, styles.badgeAssigned]}>
                <Ionicons name="person-circle-outline" size={12} color={DesignColors.primary} />
                <Text style={[styles.badgeText, styles.badgeTextAssigned]} numberOfLines={1}>{node.assignedAdminName}</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeUnassigned]}>
                <Ionicons name="alert-circle-outline" size={12} color={DesignColors.warning} />
                <Text style={[styles.badgeText, styles.badgeTextUnassigned]}>Unassigned</Text>
              </View>
            )}

            <View style={styles.statPill}>
              <Ionicons name="business-outline" size={12} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.statText}>{node.listingCount}</Text>
            </View>

            {node.subRegionCount > 0 && (
              <View style={styles.statPill}>
                <Ionicons name="git-branch-outline" size={12} color={DesignColors.onSurfaceVariant} />
                <Text style={styles.statText}>{node.subRegionCount}</Text>
              </View>
            )}
          </View>
        </Pressable>

        <Pressable style={styles.dots} onPress={() => onActions(node.region.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-horizontal" size={20} color={DesignColors.onSurfaceVariant} />
        </Pressable>
      </View>

      {expanded && hasChildren
        ? node.children.map((child) => (
            <RegionTreeNode key={child.region.id} node={child} nameById={nameById} onActions={onActions} />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 12,
    paddingVertical: 10,
  },
  chevron: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronClosed: { transform: [{ rotate: '-90deg' }] },
  leafDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DesignColors.borderMedium,
  },
  main: { flex: 1, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 16, fontWeight: '700', color: DesignColors.onSurface, fontFamily, flexShrink: 1 },
  breadcrumb: {
    fontSize: 12, fontWeight: '500', color: DesignColors.onSurfaceVariant, fontFamily,
    opacity: 0.6, flexShrink: 1,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999,
    maxWidth: 180,
  },
  badgeAssigned: { backgroundColor: DesignColors.primaryTint, borderWidth: 1, borderColor: DesignColors.primaryTintBorder },
  badgeUnassigned: { backgroundColor: DesignColors.warningContainer, borderWidth: 1, borderColor: DesignColors.primaryTintBorder },
  badgeText: { fontSize: 11, fontWeight: '700', fontFamily, flexShrink: 1 },
  badgeTextAssigned: { color: DesignColors.primary },
  badgeTextUnassigned: { color: DesignColors.warning },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: DesignColors.borderFaint,
  },
  statText: { fontSize: 11, fontWeight: '700', color: DesignColors.onSurfaceVariant, fontFamily },
  dots: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.borderFaint,
  },
});
