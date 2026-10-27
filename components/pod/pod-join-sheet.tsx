import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { OpenPodDetail } from '@/components/claim/open-pod-detail';
import { useDraggableSheet } from '@/components/claim/use-draggable-sheet';
import { useEscapeKey } from '@/components/claim/use-escape-key';
import { styles } from '@/components/claim/claim-room-modal.styles';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { DesignColors } from '@/constants/design';
import { usePodMemberNavigation } from '@/hooks/use-pod-member-navigation';
import type { RecommendedPod } from '@/types/pod-recommendation';

type Props = {
  pod: RecommendedPod | null;
  onClose: () => void;
  onJoin: (pod: RecommendedPod) => void;
  joining: boolean;
};

/**
 * Join sheet opened from a pod shelf tile. Reuses the claim wizard's sheet
 * shell so dragging, backdrop press, Escape, and the CTA all behave alike.
 */
export function PodJoinSheet({ pod, onClose, onJoin, joining }: Props) {
  const { panHandlers, sheetHeight } = useDraggableSheet();
  const openMemberProfile = usePodMemberNavigation();
  useEscapeKey(onClose, pod !== null);

  if (!pod) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <SafeKeyboardView style={styles.flex}>
        <View style={styles.backdrop}>
          <Pressable
            style={styles.scrimSpace}
            onPress={onClose}
            accessibilityLabel="Close pod details"
            accessibilityRole="button"
          />
          <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
            <View {...panHandlers} style={styles.handleArea}>
              <View style={styles.handle} />
              <Pressable
                style={sheetStyles.close}
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Dismiss pod"
              >
                <Ionicons name="close" size={18} color={DesignColors.onSurfaceVariant} />
              </Pressable>
            </View>

            <OpenPodDetail
              pod={pod}
              listing={pod.listing}
              onOpenProfile={openMemberProfile}
              onJoin={() => onJoin(pod)}
              joining={joining}
            />
          </Animated.View>
        </View>
      </SafeKeyboardView>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  close: {
    position: 'absolute',
    right: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
