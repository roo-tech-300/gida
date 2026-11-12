import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { canSubmitDecline, composeDeclineReason, DECLINE_REASONS, OTHER_REASON_KEY } from '@/utils/decline-reasons';

type Props = {
  visible: boolean;
  applicantLabel: string;
  placeLabel: string;
  submitting: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
};

/**
 * Decline with a reason chip, an optional note, and a preview of what the student will read.
 * The parent gives it a `key` per application so every opening starts blank.
 */
export function DeclineSheet({ visible, applicantLabel, placeLabel, submitting, onSubmit, onClose }: Props) {
  const [reasonKey, setReasonKey] = useState<string | null>(null);
  const [note, setNote] = useState('');
  useEscapeKey(onClose, visible);

  const message = composeDeclineReason(reasonKey, note);
  const canSubmit = canSubmitDecline(reasonKey, note) && !submitting;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" testID="decline-backdrop">
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.grabber} />
            <ScrollView keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>Decline {applicantLabel}?</Text>
              <Text style={styles.sub}>{placeLabel}. Pick a reason. They will see it.</Text>
              <View style={styles.chips}>
                {DECLINE_REASONS.map((reason) => {
                  const active = reason.key === reasonKey;
                  return (
                    <Pressable key={reason.key} onPress={() => setReasonKey(reason.key)} style={[styles.chip, active && styles.chipActive]} accessibilityRole="radio" accessibilityState={{ selected: active }} testID={`decline-reason-${reason.key}`}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{reason.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.label}>{reasonKey === OTHER_REASON_KEY ? 'Tell them why' : 'Add a note (optional)'}</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Try Prime Lodge next door, 2 spots open"
                placeholderTextColor={DesignColors.outline}
                style={styles.input}
                multiline
                maxLength={280}
                testID="decline-note"
              />
              {message ? (
                <View style={styles.preview} testID="decline-preview">
                  <Text style={styles.previewLabel}>WHAT THEY WILL SEE</Text>
                  <Text style={styles.previewText}>{message} You have not been charged.</Text>
                </View>
              ) : null}
              <Pressable style={[styles.submit, !canSubmit && styles.submitOff]} disabled={!canSubmit} onPress={() => onSubmit(message)} accessibilityRole="button" testID="decline-submit">
                {submitting ? <ActivityIndicator size="small" color={DesignColors.error} /> : <Text style={styles.submitText}>Decline and notify</Text>}
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: DesignColors.scrimHeavy },
  sheet: {
    maxHeight: '88%', paddingHorizontal: DesignSpacing.marginMobile, paddingTop: DesignSpacing.sm, paddingBottom: DesignSpacing.lg,
    borderTopLeftRadius: DesignRadius.xl, borderTopRightRadius: DesignRadius.xl, backgroundColor: DesignColors.surface,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: DesignColors.borderStrong, marginBottom: DesignSpacing.md },
  title: { ...DesignTypography.headlineMd, fontSize: 22, color: DesignColors.onSurface, fontFamily, fontWeight: '800' },
  sub: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 4, marginBottom: DesignSpacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: DesignSpacing.sm },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 19, justifyContent: 'center', backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.borderMedium },
  chipActive: { backgroundColor: DesignColors.primary, borderColor: DesignColors.primary },
  chipText: { ...DesignTypography.labelLg, color: DesignColors.onSurfaceVariant, fontFamily },
  chipTextActive: { color: DesignColors.onPrimary, fontWeight: '700' },
  label: { ...DesignTypography.labelLg, color: DesignColors.onSurfaceVariant, fontFamily, marginTop: DesignSpacing.lg, marginBottom: DesignSpacing.sm },
  input: {
    minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderRadius: DesignRadius.md, color: DesignColors.onSurface, fontFamily, fontSize: 15,
    backgroundColor: DesignColors.surfaceContainer, borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  preview: { marginTop: DesignSpacing.md, padding: DesignSpacing.md, gap: 6, borderRadius: DesignRadius.md, backgroundColor: DesignColors.surfaceContainerLow },
  previewLabel: { ...DesignTypography.labelSm, color: DesignColors.outline, fontFamily, fontWeight: '700', letterSpacing: 1 },
  previewText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20 },
  submit: { height: 52, marginTop: DesignSpacing.lg, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: DesignColors.danger },
  submitOff: { opacity: 0.4 },
  submitText: { ...DesignTypography.labelLg, fontSize: 15, color: DesignColors.error, fontFamily, fontWeight: '700' },
});
