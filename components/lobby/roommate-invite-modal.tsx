import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, Pressable, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useSearchProfiles } from '@/hooks/use-profile-search';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitInvite: (name: string, userId?: string) => void;
}

export function RoommateInviteModal({ visible, onClose, onSubmitInvite }: Props) {
  const [inputVal, setInputVal] = useState('');
  const { data: results = [] } = useSearchProfiles(inputVal);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onClose]);

  const handleSend = (name?: string, userId?: string) => {
    const finalName = name ?? inputVal.trim();
    if (!finalName) return;
    onSubmitInvite(finalName, userId);
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
              Type your friend&apos;s name to search, or enter any identifier to invite them.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Search by name..."
              placeholderTextColor={DesignColors.onSurfaceVariant}
              value={inputVal}
              onChangeText={setInputVal}
              autoCapitalize="words"
              autoCorrect={false}
            />

            {results.length > 0 && (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                style={styles.suggestionList}
                renderItem={({ item }) => (
                  <Pressable style={styles.suggestionRow} onPress={() => handleSend(item.full_name ?? 'Roommate', item.id)}>
                    <View style={styles.suggestionAvatar}>
                      <Text style={styles.suggestionInitial}>{(item.full_name ?? 'R')[0]?.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.suggestionName} numberOfLines={1}>{item.full_name}</Text>
                    <Ionicons name="person-add-outline" size={16} color={DesignColors.primaryBright} />
                  </Pressable>
                )}
              />
            )}

            <View style={styles.footer}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.submitBtn, !inputVal.trim() && styles.submitBtnDisabled]}
                onPress={() => handleSend()}
                disabled={!inputVal.trim()}
              >
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
  backdrop: { flex: 1, backgroundColor: DesignColors.scrimHeavy, justifyContent: 'center', alignItems: 'center', padding: DesignSpacing.lg },
  keyboardWrap: { width: '100%', maxWidth: 420, justifyContent: 'center' },
  dialog: { backgroundColor: DesignColors.surface, borderRadius: DesignRadius.lg, padding: DesignSpacing.lg, borderWidth: 1, borderColor: DesignColors.cardBorder, gap: DesignSpacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontWeight: '800', fontFamily },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, lineHeight: 20 },
  input: { backgroundColor: DesignColors.surfaceContainerLowest, borderWidth: 1, borderColor: DesignColors.cardBorder, borderRadius: DesignRadius.md, paddingHorizontal: DesignSpacing.md, paddingVertical: 12, color: DesignColors.onSurface, ...DesignTypography.bodyMd },
  suggestionList: { maxHeight: 160, borderRadius: DesignRadius.sm, backgroundColor: DesignColors.surfaceContainerLow },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, paddingHorizontal: DesignSpacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: DesignColors.borderFaint },
  suggestionAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: DesignColors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  suggestionInitial: { fontSize: 13, fontWeight: '700', color: DesignColors.onPrimaryContainer, fontFamily },
  suggestionName: { flex: 1, ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: DesignSpacing.md, marginTop: 4 },
  cancelBtn: { paddingHorizontal: DesignSpacing.md, paddingVertical: 10, borderRadius: DesignRadius.sm, justifyContent: 'center' },
  cancelText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontWeight: '600' },
  submitBtn: { backgroundColor: DesignColors.primaryContainer, paddingHorizontal: DesignSpacing.lg, paddingVertical: 10, borderRadius: DesignRadius.sm, justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimaryContainer, fontWeight: '700' },
});
