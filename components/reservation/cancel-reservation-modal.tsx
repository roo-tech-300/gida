import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import { useCancelReservation } from '@/hooks/use-cancel-reservation';
import { cancelErrorMessage } from '@/utils/cancel-error-message';

type Props = {
  visible: boolean;
  creditId: string | null;
  placeTitle?: string;
  onClose: () => void;
};

/** Asks once, then cancels. Closes on an outside tap, Escape, or "Keep my request". */
export function CancelReservationModal({ visible, creditId, placeTitle, onClose }: Props) {
  const { mutateAsync, isPending } = useCancelReservation();
  const { showToast } = useAppToast();
  useEscapeKey(onClose, visible && !isPending);

  const confirm = async () => {
    if (!creditId) return;
    try {
      await mutateAsync(creditId);
      showToast({ message: 'Request cancelled. You have not been charged.', type: 'success' });
      onClose();
    } catch (error) {
      console.error('[CancelReservation] Could not cancel:', error);
      showToast({ message: cancelErrorMessage(error), type: 'error' });
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={isPending ? undefined : onClose} accessibilityLabel="Close" />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.handle} />
          <Text style={styles.title} accessibilityRole="header">Cancel this request?</Text>
          <Text style={styles.body}>
            {placeTitle ? `Your spot at ${placeTitle} will be released. ` : 'Your spot will be released. '}
            You have not been charged, and you can reserve again later if it is still available.
          </Text>
          <Pressable accessibilityRole="button" onPress={confirm} disabled={isPending} style={[styles.danger, isPending && styles.disabled]}>
            {isPending ? <ActivityIndicator color={DesignColors.onError} /> : <Text style={styles.dangerText}>Yes, cancel request</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose} disabled={isPending} style={styles.keep}>
            <Text style={styles.keepText}>Keep my request</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: DesignColors.scrim },
  sheet: {
    gap: DesignSpacing.md,
    padding: DesignSpacing.lg,
    paddingBottom: DesignSpacing.xl,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: DesignColors.surface,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: DesignColors.outlineVariant },
  title: { fontFamily, fontSize: 22, fontWeight: '800', color: DesignColors.onSurface },
  body: { fontFamily, fontSize: 14, lineHeight: 21, color: DesignColors.onSurfaceVariant },
  danger: { height: 52, borderRadius: DesignRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.error },
  dangerText: { fontFamily, fontSize: 16, fontWeight: '700', color: DesignColors.onError },
  disabled: { opacity: 0.7 },
  keep: { height: 48, borderRadius: DesignRadius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: DesignColors.borderMedium },
  keepText: { fontFamily, fontSize: 15, fontWeight: '700', color: DesignColors.onSurface },
});
