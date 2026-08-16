import { useEffect } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  visible: boolean;
  listingTitle: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function CancelApplicationModal({ visible, listingTitle, isPending = false, onClose, onConfirm }: Props) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) onClose();
    };
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [visible, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.warningCircle}>
            <Ionicons name="close" size={26} color={DesignColors.error} />
          </View>
          <Text style={styles.title}>Cancel your application?</Text>
          <Text style={styles.subtitle}>
            Your pending spot on <Text style={styles.bold}>{listingTitle}</Text> will be released, and you can claim it again later.
          </Text>
          <Pressable
            style={[styles.confirmBtn, isPending && styles.confirmBtnDisabled]}
            onPress={isPending ? undefined : onConfirm}
            disabled={isPending}
            testID="cancel-application-confirm"
          >
            {isPending ? (
              <ActivityIndicator size="small" color={DesignColors.onErrorContainer} />
            ) : (
              <Ionicons name="close-circle-outline" size={18} color={DesignColors.onErrorContainer} />
            )}
            <Text style={styles.confirmBtnText}>{isPending ? 'Cancelling…' : 'Yes, Cancel Application'}</Text>
          </Pressable>
          <Pressable style={styles.dismissBtn} onPress={onClose} disabled={isPending}>
            <Text style={styles.dismissText}>Keep my spot</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: DesignColors.scrimHeavy,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSpacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: DesignColors.surface,
    borderRadius: DesignRadius.lg,
    padding: DesignSpacing.lg,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  warningCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DesignColors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSpacing.xs,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: DesignSpacing.md,
  },
  bold: { fontWeight: '700', color: DesignColors.onSurface },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    backgroundColor: DesignColors.errorContainer,
    borderRadius: DesignRadius.full,
    paddingVertical: 14,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onErrorContainer,
    fontFamily,
    fontWeight: '700',
  },
  dismissBtn: { paddingVertical: DesignSpacing.sm, alignSelf: 'center' },
  dismissText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, fontWeight: '600' },
});
