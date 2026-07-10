import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { type MessageItem } from '@/dummy/messages-mock';

export function MessageBubble({
  message,
  avatar,
  isMe,
}: {
  message: MessageItem;
  avatar?: number;
  isMe: boolean;
}) {
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      {!isMe && (
        <Image source={avatar} style={styles.avatar} contentFit="cover" />
      )}
      <View style={styles.bubbleWrap}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.text, isMe && styles.textMe]}>{message.text}</Text>
        </View>
        <Text style={[styles.time, isMe && styles.timeMe]}>Delivered • {message.time}</Text>
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
    maxWidth: '72%',
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
  time: {
    ...DesignTypography.labelSm,
    color: DesignColors.outlineVariant,
    fontFamily,
    marginTop: 4,
    marginLeft: 4,
  },
  timeMe: {
    textAlign: 'right',
    marginLeft: 0,
    marginRight: 4,
  },
});
