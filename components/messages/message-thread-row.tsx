import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { type Conversation } from '@/types/messages';
import { formatRelativeTime } from '@/utils/format-relative-time';
import { getInitials } from '@/utils/initials';

export function MessageThreadRow({
  thread,
  onPress,
}: {
  thread: Conversation;
  onPress?: () => void;
}) {
  const { profile } = useAuth();
  const isUnread = thread.unreadCount > 0;

  const isMine = !!profile?.id && thread.lastMessageSenderId === profile.id;
  const senderName = thread.participant.name.trim().split(' ')[0];
  const senderPrefix = isMine ? 'You: ' : thread.lastMessageSenderId ? `${senderName}: ` : '';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, isUnread && styles.rowUnread]}
    >
      <View style={styles.avatarWrap}>
        {thread.participant.avatarUrl ? (
          <Image source={{ uri: thread.participant.avatarUrl }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{getInitials(thread.participant.name)}</Text>
          </View>
        )}
        {isUnread ? <View style={styles.unreadDot} /> : null}
      </View>

      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text
            style={[styles.name, isUnread && styles.nameUnread]}
            numberOfLines={1}
          >
            {thread.participant.name}
          </Text>
          <Text style={[styles.time, isUnread && styles.timeUnread]}>
            {formatRelativeTime(thread.lastMessageAt)}
          </Text>
        </View>
        <View style={styles.bottomLine}>
          <Text
            style={[styles.message, isUnread && styles.messageUnread]}
            numberOfLines={1}
          >
            {senderPrefix ? <Text style={styles.senderPrefix}>{senderPrefix}</Text> : null}
            {thread.lastMessage}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    paddingVertical: 20,
    paddingHorizontal: DesignSpacing.marginMobile,
  },
  rowUnread: {
    backgroundColor: DesignColors.primaryTint,
  },
  avatarWrap: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primary,
  },
  avatarInitials: {
    fontSize: 18,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '800',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: DesignColors.surfaceContainerLowest,
    backgroundColor: DesignColors.primary,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: DesignSpacing.sm,
  },
  name: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: DesignColors.onSurface,
    fontFamily,
    flex: 1,
  },
  nameUnread: {
    fontWeight: '700',
  },
  time: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  timeUnread: {
    color: DesignColors.primary,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  message: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
  messageUnread: {
    color: DesignColors.onSurface,
    fontWeight: '600',
  },
  senderPrefix: {
    fontWeight: '700',
  },
});