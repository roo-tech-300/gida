import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { ListingAttachment } from '@/types/messages';
import { ComposerAttachmentPreview } from './composer-attachment-preview';

type MessageComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onOpenAttachments: () => void;
  attachment?: ListingAttachment | null;
  onClearAttachment?: () => void;
};

export function MessageComposer({
  draft,
  onDraftChange,
  onSend,
  onOpenAttachments,
  attachment,
  onClearAttachment,
}: MessageComposerProps) {
  const canSend = draft.trim().length > 0 || Boolean(attachment);

  return (
    <View style={styles.composerShell}>
      {attachment ? (
        <ComposerAttachmentPreview attachment={attachment} onClear={onClearAttachment} />
      ) : null}

      <View style={styles.composer}>
        <Pressable onPress={onOpenAttachments} style={styles.iconButton} accessibilityLabel="Add attachment">
          <Ionicons name="add" size={22} color={DesignColors.onSurface} />
        </Pressable>

        <TextInput
          multiline
          placeholder={attachment ? 'Add a message about this listing…' : 'Message'}
          placeholderTextColor={DesignColors.onSurfaceVariant}
          style={styles.input}
          value={draft}
          onChangeText={onDraftChange}
          textAlignVertical="top"
        />

        <Pressable
          onPress={onSend}
          disabled={!canSend}
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          accessibilityLabel="Send message"
        >
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
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: DesignSpacing.sm,
    padding: DesignSpacing.sm,
    borderRadius: 28,
    backgroundColor: DesignColors.surfaceContainer,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
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
