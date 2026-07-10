import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { type Conversation } from '@/dummy/messages-mock';

export function MessageThreadRow({
  thread,
  onPress,
}: {
  thread: Conversation;
  onPress?: () => void;
}) {
  const isUnread = thread.unreadCount > 0;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, isUnread && styles.rowUnread]}
    >
      <View style={styles.avatarWrap}>
        {thread.verified ? (
          <Image source={thread.image} style={styles.avatar} contentFit="cover" />
        ) : (
          <Image source={thread.image} style={styles.avatar} contentFit="cover" />
        )}
        {thread.verified ? (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedIcon}>✓</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text
            style={[styles.name, isUnread && styles.nameUnread]}
            numberOfLines={1}
          >
            {thread.name}
          </Text>
          <Text style={[styles.time, isUnread && styles.timeUnread]}>
            {thread.time}
          </Text>
        </View>
        <View style={styles.bottomLine}>
          <Text
            style={[styles.message, isUnread && styles.messageUnread]}
            numberOfLines={1}
          >
            {thread.lastMessage}
          </Text>
          {isUnread ? <View style={styles.unreadDot} /> : null}
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
    backgroundColor: 'rgba(210, 187, 255, 0.05)',
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
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryContainer,
    borderWidth: 2,
    borderColor: DesignColors.surfaceContainerLowest,
  },
  verifiedIcon: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '800',
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
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DesignColors.primary,
  },
});
