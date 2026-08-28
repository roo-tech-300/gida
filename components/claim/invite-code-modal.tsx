import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAppToast } from '@/components/ui/toast-card';
import { copyTextToClipboard } from '@/utils/clipboard';

type Props = {
  visible: boolean;
  code: string;
  onClose: () => void;
};

const STEPS = [
  'Share this code with your friend.',
  'Your friend creates a Gida account.',
  'On the Profile tab, they tap "Have an invite code?"',
  'They enter the code and join your group.',
];

export function InviteCodeModal({ visible, code, onClose }: Props) {
  const { showToast } = useAppToast();

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onClose]);

  const handleCopy = async () => {
    const copied = await copyTextToClipboard(code);
    showToast({ message: copied ? `Code copied: ${code}` : `Share this code: ${code}`, type: 'success' });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="invite-code-backdrop">
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Friend not on Gida?</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={DesignColors.onSurfaceVariant} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>They can join your group with this code — no Gida account needed to claim the spot.</Text>

          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>GROUP CODE</Text>
            <Pressable style={styles.codeBadge} onPress={handleCopy} accessibilityRole="button" testID="copy-code">
              <Ionicons name="link-outline" size={18} color={DesignColors.primaryBright} />
              <Text style={styles.codeValue}>{code}</Text>
              <Ionicons name="copy-outline" size={18} color={DesignColors.onSurfaceVariant} />
            </Pressable>
          </View>

          <View style={styles.steps}>
            {STEPS.map((step, index) => (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: DesignColors.scrimHeavy, justifyContent: 'center', alignItems: 'center', padding: DesignSpacing.lg },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: DesignColors.surface,
    borderRadius: DesignRadius.lg,
    padding: DesignSpacing.lg,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    gap: DesignSpacing.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontWeight: '800', fontFamily },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, lineHeight: 20 },
  codeCard: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    padding: DesignSpacing.md,
    gap: DesignSpacing.sm,
  },
  codeLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.surfaceContainerLowest,
    borderRadius: DesignRadius.sm,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    paddingHorizontal: DesignSpacing.sm + 2,
    paddingVertical: DesignSpacing.sm + 2,
  },
  codeValue: {
    flex: 1,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  steps: { gap: DesignSpacing.sm + 2 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { fontSize: 12, fontWeight: '800', color: DesignColors.onPrimaryContainer, fontFamily },
  stepText: { flex: 1, fontSize: 13, lineHeight: 18, color: DesignColors.onSurface, fontFamily },
});
