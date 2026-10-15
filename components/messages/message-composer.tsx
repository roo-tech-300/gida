import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type MessageComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onOpenAttachments: () => void;
  selectedAttachmentLabel?: string;
  onClearAttachment?: () => void;
};

export function MessageComposer({
  draft,
  onDraftChange,
  onSend,
  onOpenAttachments,
  selectedAttachmentLabel,
  onClearAttachment,
}: MessageComposerProps) {
  const canSend = draft.trim().length > 0 || Boolean(selectedAttachmentLabel);

  return (
    <View style={styles.composerShell}>
      {selectedAttachmentLabel ? (
        <View style={styles.hintRow}>
          <Ionicons name="home-outline" size={13} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.hint} numberOfLines={1}>{selectedAttachmentLabel}</Text>
          {onClearAttachment ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove attachment"
              onPress={onClearAttachment}
              hitSlop={8}
              style={styles.hintClear}
            >
              <Ionicons name="close" size={14} color={DesignColors.onSurfaceVariant} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={styles.composer}>
        <Pressable onPress={onOpenAttachments} style={styles.iconButton}>
          <Ionicons name="add" size={22} color={DesignColors.onSurface} />
        </Pressable>
        <TextInput
          multiline
          placeholder="Message"
          placeholderTextColor={DesignColors.onSurfaceVariant}
          style={styles.input}
          value={draft}
          onChangeText={onDraftChange}
          textAlignVertical="top"
        />
        <Pressable onPress={onSend} disabled={!canSend} style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}>
          <Ionicons name="send" size={18} color={canSend ? DesignColors.onPrimaryContainer : DesignColors.outline} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  composerShell: {
    paddingHorizontal: DesignSpacing.md,
    paddingTop: DesignSpacing.sm,
    paddingBottom: DesignSpacing.md,
    backgroundColor: 'transparent',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: DesignSpacing.xs,
    paddingHorizontal: DesignSpacing.sm,
  },
  hint: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
  hintClear: {
    padding: 4,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: DesignSpacing.sm,
    padding: DesignSpacing.sm,
    borderRadius: 28,
    backgroundColor: DesignColors.surfaceContainer,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    boxShadow: `0 10px 24px ${DesignColors.scrim}`,
    borderCurve: 'continuous',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.borderFaint,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    paddingHorizontal: DesignSpacing.sm,
    paddingTop: 11,
    paddingBottom: 11,
    color: DesignColors.onSurface,
    ...DesignTypography.bodyLg,
    fontFamily,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryContainer,
  },
  sendButtonDisabled: {
    backgroundColor: DesignColors.borderSoft,
  },
});
