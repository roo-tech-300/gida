import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { MESSAGE_STATUS_ICON, MESSAGE_STATUS_LABEL, type ChatMessage } from '@/types/messages';
import { formatRelativeTime } from '@/utils/format-relative-time';
import { MessageListingCard } from '@/components/messages/message-listing-card';

export function MessageBubble({
  message,
  avatar,
  isMe,
  onRetry,
}: {
  message: ChatMessage;
  avatar?: string | null;
  isMe: boolean;
  onRetry?: (messageId: string) => void;
}) {
  const status = message.status ?? null;
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      {!isMe && avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
      ) : null}
      <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapRight]}>
        {message.attachment ? (
          <MessageListingCard attachment={message.attachment} isMe={isMe} />
        ) : null}
        {message.body ? (
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text style={[styles.text, isMe && styles.textMe]}>{message.body}</Text>
          </View>
        ) : null}
        <View style={[styles.footerRow, isMe && styles.footerRowMe]}>
          {status ? (
            <Pressable
              disabled={status === 'outbox'}
              onPress={() => onRetry?.(message.id)}
              style={styles.statusPill}
            >
              <Ionicons name={MESSAGE_STATUS_ICON[status]} size={12} color={DesignColors.outlineVariant} />
              <Text style={styles.statusText}>{MESSAGE_STATUS_LABEL[status]}</Text>
            </Pressable>
          ) : null}
          <Text style={[styles.time, isMe && styles.timeMe]}>
            {message.readAt ? 'Read' : 'Delivered'} • {formatRelativeTime(message.clientSentAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
    marginBottom: DesignSpacing.md,
    paddingRight: DesignSpacing.marginMobile,
  },
  rowMe: {
    flexDirection: 'row-reverse',
    paddingRight: 0,
    paddingLeft: DesignSpacing.marginMobile,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignSelf: 'flex-end',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  bubbleWrap: {
    maxWidth: '82%',
    alignItems: 'flex-start',
  },
  bubbleWrapRight: {
    alignItems: 'flex-end',
  },
  bubble: {
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm + 2,
    borderRadius: DesignRadius.lg,
  },
  bubbleThem: {
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: DesignColors.primaryContainer,
    borderBottomRightRadius: 4,
  },
  text: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    lineHeight: 21,
  },
  textMe: {
    color: DesignColors.onPrimaryContainer,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.xs,
    marginTop: 4,
  },
  footerRowMe: {
    justifyContent: 'flex-end',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    borderColor: DesignColors.borderFaint,
  },
  statusText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  time: {
    ...DesignTypography.labelSm,
    color: DesignColors.outlineVariant,
    fontFamily,
    marginLeft: 4,
  },
  timeMe: {
    textAlign: 'right',
    marginLeft: 0,
    marginRight: 4,
  },
});