import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { DesignColors, DesignSpacing } from '@/constants/design';
import { AddReviewForm } from '../add-review-form';

type Props = { visible: boolean; listingId: string; onClose: () => void };

/** The review form in a sheet. Closes on outside tap, Escape, or after the review is posted. */
export function WriteReviewSheet({ visible, listingId, onClose }: Props) {
  useEscapeKey(onClose, visible);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close review form" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <AddReviewForm listingId={listingId} onSuccess={onClose} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: DesignColors.scrim },
  sheet: {
    maxHeight: '88%',
    paddingHorizontal: DesignSpacing.md,
    paddingTop: DesignSpacing.sm,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: DesignColors.surface,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: DesignSpacing.sm, backgroundColor: DesignColors.outlineVariant },
});
