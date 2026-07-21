import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  visible: boolean;
  listingTitle: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ListingDeleteModal({ visible, listingTitle, isDeleting, onCancel, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={() => {}}>
          <View style={styles.iconWrap}>
            <Ionicons name="warning-outline" size={32} color="#ff4d4d" />
          </View>
          <Text style={styles.title}>Delete Listing</Text>
          <Text style={styles.message}>
            Are you sure you want to delete <Text style={styles.bold}>{listingTitle}</Text>? This will permanently
            remove the listing, all photos, and saved references. This action cannot be undone.
          </Text>
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={isDeleting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={onConfirm} disabled={isDeleting}>
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.deleteText}>Delete</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSpacing.marginMobile,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a1a1e',
    borderRadius: DesignRadius.lg,
    padding: DesignSpacing.xl,
    alignItems: 'center',
    gap: DesignSpacing.md,
    borderWidth: 1,
    borderColor: 'DesignColors.cardBorder',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,77,77,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSpacing.sm,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '800',
  },
  message: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: DesignColors.onSurface,
  },
  actions: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
    marginTop: DesignSpacing.sm,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: DesignRadius.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'DesignColors.glassBorder',
  },
  cancelText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: DesignRadius.lg,
    alignItems: 'center',
    backgroundColor: '#ff4d4d',
  },
  deleteText: {
    ...DesignTypography.bodyMd,
    color: '#ffffff',
    fontFamily,
    fontWeight: '700',
  },
});
