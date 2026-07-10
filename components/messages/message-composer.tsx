import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type MessageComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onOpenAttachments: () => void;
  selectedAttachmentLabel?: string;
};

export function MessageComposer({
  draft,
  onDraftChange,
  onSend,
  onOpenAttachments,
  selectedAttachmentLabel,
}: MessageComposerProps) {
  const canSend = draft.trim().length > 0;

  return (
    <View style={styles.composerShell}>
      {selectedAttachmentLabel ? <Text style={styles.hint}>{selectedAttachmentLabel}</Text> : null}
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
  hint: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginBottom: DesignSpacing.xs,
    paddingHorizontal: DesignSpacing.sm,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: DesignSpacing.sm,
    padding: DesignSpacing.sm,
    borderRadius: 28,
    backgroundColor: DesignColors.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.28)',
    borderCurve: 'continuous',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});
