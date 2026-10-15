import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useOverflowMenuAnimation } from '@/hooks/use-overflow-menu-animation';

type Props = {
  visible: boolean;
  onClose: () => void;
  saved: boolean;
  onToggleSave: () => void;
  /** Undefined hides the Conversation row (own listings / no admin owner). */
  onEnquire?: () => void;
  onShare?: () => void;
};

/**
 * Bottom-bar overflow (⋯) menu: a compact, elevated floating popover
 * anchored directly above the ellipsis action button with smooth entrance/exit animations.
 */
export function PropertyOverflowSheet({ visible, onClose, saved, onToggleSave, onEnquire, onShare }: Props) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, DesignSpacing.md) + 68;

  const { isMounted, opacity, scale, translateY, backdropOpacity, animateOut } = useOverflowMenuAnimation(
    visible,
    onClose,
  );

  useEscapeKey(() => animateOut(), isMounted);

  return (
    <Modal visible={isMounted} transparent animationType="none" onRequestClose={() => animateOut()}>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => animateOut()} accessibilityLabel="Close menu" />
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
            accessibilityLabel={saved ? 'Remove from saved' : 'Save listing'}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => animateOut(onToggleSave)}
          >
            <View style={[styles.iconWrap, saved && styles.iconWrapSaved]}>
              <Ionicons
                name={saved ? 'heart' : 'heart-outline'}
                size={18}
                color={saved ? DesignColors.primaryBright : DesignColors.onSurface}
              />
            </View>
            <Text style={[styles.rowLabel, saved && styles.rowLabelSaved]}>{saved ? 'Saved' : 'Save'}</Text>
            {saved ? (
              <Ionicons name="checkmark" size={16} color={DesignColors.primaryBright} style={styles.trailingIcon} />
            ) : null}
          </Pressable>

          {onEnquire ? (
            <>
              <View style={styles.divider} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start conversation about this listing"
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => animateOut(onEnquire)}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={DesignColors.onSurface} />
                </View>
                <Text style={styles.rowLabel}>Conversation</Text>
              </Pressable>
            </>
          ) : null}

          {onShare ? (
            <>
              <View style={styles.divider} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share listing"
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => animateOut(onShare)}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name="share-social-outline" size={18} color={DesignColors.onSurface} />
                </View>
                <Text style={styles.rowLabel}>Share</Text>
              </Pressable>
            </>
          ) : null}
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
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: DesignRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSaved: {
    backgroundColor: DesignColors.primaryTint,
  },
  rowLabel: {
    ...DesignTypography.bodyMd,
    flex: 1,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
    fontSize: 14,
  },
  rowLabelSaved: {
    color: DesignColors.primaryBright,
  },
  trailingIcon: {
    marginLeft: 'auto',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 8,
    marginVertical: 2,
  },
});