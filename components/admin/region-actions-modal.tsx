import type { ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Action = {
  key: 'add' | 'assign' | 'edit' | 'delete';
  icon: IconName;
  label: string;
  caption: string;
  destructive?: boolean;
  disabled?: boolean;
};

type Props = {
  visible: boolean;
  regionName: string;
  hasChildren: boolean;
  hasListings: boolean;
  onClose: () => void;
  onAddSubRegion: () => void;
  onAssignAdmin: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function RegionActionsModal({ visible, regionName, hasChildren, hasListings, onClose, onAddSubRegion, onAssignAdmin, onEdit, onDelete }: Props) {
  const blocked = hasChildren || hasListings;

  const actions: Action[] = [
    { key: 'add', icon: 'add-circle-outline', label: 'Add Sub-Region', caption: 'Create a child region under this one.' },
    { key: 'assign', icon: 'person-add-outline', label: 'Assign / Swap Admin', caption: 'Set or replace the regional admin.' },
    { key: 'edit', icon: 'create-outline', label: 'Edit / Move', caption: 'Rename or re-parent this region.' },
    {
      key: 'delete',
      icon: 'trash-outline',
      label: 'Delete Region',
      caption: blocked ? 'Remove sub-regions and listings first.' : 'Permanently delete this region.',
      destructive: true,
      disabled: blocked,
    },
  ];

  const handlePress = (action: Action) => {
    if (action.disabled) return;
    onClose();
    switch (action.key) {
      case 'add':
        onAddSubRegion();
        break;
      case 'assign':
        onAssignAdmin();
        break;
      case 'edit':
        onEdit();
        break;
      case 'delete':
        onDelete();
        break;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.grabber} />
          <Text style={styles.title} numberOfLines={1}>{regionName}</Text>
          <View style={styles.list}>
            {actions.map((action) => (
              <Pressable
                key={action.key}
                style={styles.row}
                onPress={() => handlePress(action)}
                disabled={action.disabled}
              >
                <Ionicons
                  name={action.icon}
                  size={20}
                  color={action.disabled ? DesignColors.onSurfaceVariant : action.destructive ? DesignColors.danger : DesignColors.primary}
                />
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, action.disabled && styles.rowLabelDisabled]}>{action.label}</Text>
                  <Text style={styles.rowCaption}>{action.caption}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={DesignColors.onSurfaceVariant} />
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: DesignColors.scrimHeavy,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: DesignSpacing.lg,
    paddingBottom: 36,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: DesignColors.borderMedium,
    marginBottom: 14,
  },
  title: {
    fontSize: 17, fontWeight: '700', color: DesignColors.onSurface, fontFamily,
    marginBottom: 10,
  },
  list: { gap: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 13, paddingHorizontal: 4,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  rowLabelDisabled: { color: DesignColors.onSurfaceVariant, opacity: 0.5 },
  rowCaption: { fontSize: 12, fontWeight: '500', color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 2, opacity: 0.6 },
});
