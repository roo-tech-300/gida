import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const STEPS = [
  'Reserve your spot.',
  'Tap "Invite a friend". You get a link for each friend, and their seat is held for 2 hours.',
  'Send the link on WhatsApp or any app. They open it, give four details and pay, with no code and no account first.',
  'Once they join, they have 24 hours to pay their share.',
];

/** Explains how a friend who is not on Gida joins: by a link made after the reservation, not a code. */
export function FriendLinkModal({ visible, onClose }: Props) {
  // Escape closes this note first. The listener runs in the capture phase so it sees the key before the
  // reservation sheet underneath, whose own Escape handler would otherwise close the whole sheet.
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', handleKeyDown, true);
      return () => window.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [visible, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="friend-link-backdrop">
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Friend not on Gida?</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={DesignColors.onSurfaceVariant} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>No problem. They do not need an account to join. After you reserve, you send each friend a link.</Text>

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
  steps: { gap: DesignSpacing.sm + 2 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: DesignSpacing.sm },
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
