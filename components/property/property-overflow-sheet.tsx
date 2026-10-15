import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  visible: boolean;
  onClose: () => void;
  saved: boolean;
  onToggleSave: () => void;
  /** Undefined hides the Enquire row (own listings / no admin owner). */
  onEnquire?: () => void;
};

/**
 * Bottom-bar overflow (⋯) menu: keeps Save and Enquire tucked behind one
 * button so the bar stays clean. Both rows share the same style.
 */
export function PropertyOverflowSheet({ visible, onClose, saved, onToggleSave, onEnquire }: Props) {
  useEscapeKey(onClose, visible);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Remove from saved' : 'Save listing'}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => {
              onToggleSave();
              onClose();
            }}
          >
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={20}
              color={saved ? DesignColors.primaryBright : DesignColors.onSurface}
            />
            <Text style={styles.rowLabel}>{saved ? 'Saved' : 'Save'}</Text>
          </Pressable>

          {onEnquire ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enquire about this listing"
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => {
                onClose();
                onEnquire();
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={DesignColors.onSurface} />
              <Text style={styles.rowLabel}>Enquire</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: `${DesignColors.scrim}66`,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: DesignColors.surface,
    borderTopLeftRadius: DesignRadius.xl,
    borderTopRightRadius: DesignRadius.xl,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.sm,
    paddingBottom: DesignSpacing.xl,
    gap: DesignSpacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: DesignColors.borderSoft,
    marginBottom: DesignSpacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    height: 48,
    paddingHorizontal: DesignSpacing.md,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowLabel: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
});