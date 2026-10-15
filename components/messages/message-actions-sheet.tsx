import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useOverflowMenuAnimation } from '@/hooks/use-overflow-menu-animation';

type Props = {
  visible: boolean;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  /** Attachment-only messages have no text to copy. */
  canCopy: boolean;
};

/**
 * Long-press chat message actions: same compact, elevated popover design and
 * animation as the listing-details overflow menu (PropertyOverflowSheet),
 * anchored above the message composer.
 */
export function MessageActionsSheet({ visible, onClose, onReply, onCopy, canCopy }: Props) {
  const insets = useSafeAreaInsets();
  // Above the composer shell (~74pt + bottom inset).
  const bottomOffset = Math.max(insets.bottom, DesignSpacing.md) + 90;

  const { isMounted, opacity, scale, translateY, backdropOpacity, animateOut } = useOverflowMenuAnimation(
    visible,
    onClose,
  );

  useEscapeKey(() => animateOut(), isMounted);

  return (
    <Modal visible={isMounted} transparent animationType="none" onRequestClose={() => animateOut()}>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => animateOut()} accessibilityLabel="Close message actions" />
        </Animated.View>

        <Animated.View
          style={[
            styles.menuCard,
            {
              bottom: bottomOffset,
              left: DesignSpacing.marginMobile,
              opacity,
              transform: [{ translateY }, { scale }],
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reply to message"
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => animateOut(onReply)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="arrow-undo-outline" size={18} color={DesignColors.onSurface} />
            </View>
            <Text style={styles.rowLabel}>Reply</Text>
          </Pressable>

          <View style={styles.divider} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy message text"
            disabled={!canCopy}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed, !canCopy && styles.rowDisabled]}
            onPress={() => animateOut(onCopy)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="copy-outline" size={18} color={canCopy ? DesignColors.onSurface : DesignColors.outline} />
            </View>
            <Text style={[styles.rowLabel, !canCopy && styles.rowLabelDisabled]}>Copy</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  menuCard: {
    position: 'absolute',
    width: 200,
    backgroundColor: '#1b1b1e',
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm + 2,
    height: 44,
    paddingHorizontal: DesignSpacing.sm + 2,
    borderRadius: DesignRadius.md,
  },
  rowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  rowDisabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: DesignRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...DesignTypography.bodyMd,
    flex: 1,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
    fontSize: 14,
  },
  rowLabelDisabled: {
    color: DesignColors.outline,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 8,
    marginVertical: 2,
  },
});