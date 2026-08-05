import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitInvite: (studentIdOrEmail: string) => void;
}

export function RoommateInviteModal({ visible, onClose, onSubmitInvite }: Props) {
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onClose]);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    onSubmitInvite(inputVal.trim());
    setInputVal('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="modal-backdrop">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardWrap}
          pointerEvents="box-none"
        >
          <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>Invite Roommate</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={24} color={DesignColors.onSurfaceVariant} />
              </Pressable>
            </View>

            <Text style={styles.subtitle}>
              Enter your friend&apos;s Student ID or University email. They will receive an invitation to join your Pod with separate billing.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., student@unilag.edu.ng or ID: 190408"
              placeholderTextColor={DesignColors.onSurfaceVariant}
              value={inputVal}
              onChangeText={setInputVal}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.footer}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.submitBtn, !inputVal.trim() && styles.submitBtnDisabled]} onPress={handleSend} disabled={!inputVal.trim()}>
                <Text style={styles.submitText}>Send Invite</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: DesignSpacing.lg },
  keyboardWrap: { width: '100%', maxWidth: 420, justifyContent: 'center' },
  dialog: { backgroundColor: DesignColors.surface, borderRadius: DesignRadius.lg, padding: DesignSpacing.lg, borderWidth: 1, borderColor: DesignColors.cardBorder, gap: DesignSpacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontWeight: '800', fontFamily },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, lineHeight: 20 },
  input: { backgroundColor: DesignColors.surfaceContainerLowest, borderWidth: 1, borderColor: DesignColors.cardBorder, borderRadius: DesignRadius.md, paddingHorizontal: DesignSpacing.md, paddingVertical: 12, color: DesignColors.onSurface, ...DesignTypography.bodyMd },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: DesignSpacing.md, marginTop: 4 },
  cancelBtn: { paddingHorizontal: DesignSpacing.md, paddingVertical: 10, borderRadius: DesignRadius.sm, justifyContent: 'center' },
  cancelText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontWeight: '600' },
  submitBtn: { backgroundColor: DesignColors.primaryContainer, paddingHorizontal: DesignSpacing.lg, paddingVertical: 10, borderRadius: DesignRadius.sm, justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimaryContainer, fontWeight: '700' },
});
