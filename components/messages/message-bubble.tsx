import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { MESSAGE_STATUS_ICON, MESSAGE_STATUS_LABEL, type ChatMessage } from '@/types/messages';
import { formatRelativeTime } from '@/utils/format-relative-time';
import { MessageListingCard } from '@/components/messages/message-listing-card';
import { MessageTourCard } from '@/components/messages/message-tour-card';
import { MessageRoommateInviteCard } from '@/components/messages/message-roommate-invite-card';
import { MessagePodJoinCard } from '@/components/messages/message-pod-join-card';
import { MessageLodgeReservationCard } from '@/components/messages/message-lodge-reservation-card';
import { MessageTruncatedText } from '@/components/messages/message-truncated-text';

const BODY_COLLAPSED_LINES = 15;
const QUOTE_MAX_LINES = 3;

/** Quoted reply strip rendered INSIDE the bubble, above the reply text. */
function ReplyQuote({
  reply,
  label,
  isMe,
}: {
  reply: NonNullable<ChatMessage['replyTo']>;
  label: string;
  isMe: boolean;
}) {
  return (
    <View style={[styles.quote, isMe ? styles.quoteMe : styles.quoteThem]}>
      <Text style={[styles.quoteLabel, isMe && styles.quoteLabelMe]} numberOfLines={1}>
        {label}
      </Text>
      {/* Replies quote compactly: 3-line clamp, no read-more toggle. */}
      <Text style={[styles.quoteSnippet, isMe && styles.quoteSnippetMe]} numberOfLines={QUOTE_MAX_LINES}>
        {reply.body.trim() || 'Attachment'}
      </Text>
    </View>
  );
}

export function MessageBubble({
  message,
  avatar,
  participantName,
  isMe,
  onRetry,
  onLongPress,
}: {
  message: ChatMessage;
  avatar?: string | null;
  participantName?: string | null;
  isMe: boolean;
  onRetry?: (messageId: string) => void;
  onLongPress?: (message: ChatMessage) => void;
}) {
  const status = message.status ?? null;
  const isRoommateInvite = message.attachment?.type === 'roommate_invite';
  const isPodJoin = message.attachment?.type === 'pod_join';
  const replyTo = message.replyTo ?? null;
  // The quoted sender is "You" when it matches the viewer: the bubble author
  // quoting themselves, or the other participant quoting the viewer.
  const quotedFromMe = replyTo
    ? (isMe && replyTo.senderId === message.senderId) || (!isMe && replyTo.senderId !== message.senderId)
    : false;
  const replyLabel = replyTo ? (quotedFromMe ? 'You' : participantName ?? 'Them') : '';
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      {!isMe && avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
      ) : null}
      <Pressable
        onLongPress={() => onLongPress?.(message)}
        delayLongPress={350}
        disabled={!onLongPress}
        accessibilityRole="button"
        accessibilityLabel="Message actions"
        style={({ pressed }) => [styles.bubbleWrap, isMe && styles.bubbleWrapRight, pressed && onLongPress ? styles.pressed : null]}
      >
        {message.attachment?.type === 'listing' ? (
          <MessageListingCard attachment={message.attachment} isMe={isMe} />
        ) : message.attachment?.type === 'tour' ? (
          <MessageTourCard attachment={message.attachment} isMe={isMe} />
        ) : message.attachment?.type === 'roommate_invite' ? (
          <MessageRoommateInviteCard attachment={message.attachment} isMe={isMe} participantName={participantName} />
        ) : message.attachment?.type === 'pod_join' ? (
          <MessagePodJoinCard attachment={message.attachment} isMe={isMe} />
        ) : message.attachment?.type === 'lodge_reservation' ? (
          <MessageLodgeReservationCard attachment={message.attachment} isMe={isMe} />
        ) : null}
        {message.body && !isRoommateInvite && !isPodJoin ? (
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            {replyTo ? <ReplyQuote reply={replyTo} label={replyLabel} isMe={isMe} /> : null}
            <MessageTruncatedText
              text={message.body}
              collapsedLines={BODY_COLLAPSED_LINES}
              style={[styles.text, isMe && styles.textMe]}
              linkStyle={isMe ? styles.linkMe : undefined}
            />
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
      </Pressable>
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
  pressed: {
    opacity: 0.85,
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
  quote: {
    alignSelf: 'stretch',
    borderRadius: DesignRadius.sm,
    paddingHorizontal: DesignSpacing.sm + 2,
    paddingVertical: DesignSpacing.xs + 2,
    marginBottom: DesignSpacing.sm - 2,
    borderLeftWidth: 3,
  },
  quoteThem: {
    backgroundColor: DesignColors.surfaceContainerHighest,
    borderLeftColor: DesignColors.primaryBright,
  },
  quoteMe: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderLeftColor: DesignColors.primaryFixed,
  },
  quoteLabel: {
    ...DesignTypography.labelSm,
    fontSize: 11,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '700',
    marginBottom: 1,
  },
  quoteLabelMe: {
    color: DesignColors.primaryFixed,
  },
  quoteSnippet: {
    ...DesignTypography.labelSm,
    fontSize: 12,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 16,
  },
  quoteSnippetMe: {
    color: DesignColors.onPrimaryContainer,
    opacity: 0.85,
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
  linkMe: {
    color: DesignColors.primaryFixed,
  },
});