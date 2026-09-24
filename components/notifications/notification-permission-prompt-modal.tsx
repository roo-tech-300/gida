import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useNotificationPermission } from '@/src/use-notification-permission-platform';
import { useAppToast } from '@/components/ui/toast-card';

type Props = {
  visible: boolean;
  title: string;
  description: string;
  onClose: () => void;
};

export function NotificationPermissionPromptModal({ visible, title, description, onClose }: Props) {
  const { enable } = useNotificationPermission();
  const { showToast } = useAppToast();

  const handleEnable = async () => {
    onClose();
    const result = await enable();
    if (result.enabled) {
      showToast({ type: 'success', message: 'Notifications are on.' });
      return;
    }
    if (result.status === 'denied') {
      showToast({ type: 'info', message: 'Turn on notifications in your device settings.' });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconCircle}>
            <Ionicons name="notifications-outline" size={28} color={DesignColors.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{description}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} accessibilityRole="button">
              <Text style={styles.cancelText}>Not now</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => void handleEnable()} accessibilityRole="button">
              <Text style={styles.primaryText}>Enable</Text>
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
    backgroundColor: DesignColors.scrimHeavy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSpacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.xl,
    padding: DesignSpacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSpacing.md,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: DesignSpacing.xs,
  },
  body: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    marginBottom: DesignSpacing.lg,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.borderFaint,
  },
  cancelText: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primary,
  },
  primaryText: {
    ...DesignTypography.labelLg,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
});
