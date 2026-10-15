import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { MessageReply } from '@/types/messages';

type Props = {
  reply: MessageReply;
  senderName: string | null | undefined;
  onClear: () => void;
};

/** Quote strip shown above the composer while replying to a message. */
export function ComposerReplyPreview({ reply, senderName, onClear }: Props) {
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 110,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const snippet = reply.body.trim() || 'Attachment';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.96, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.stripe} />

      <View style={styles.info}>
        <View style={styles.badgeRow}>
          <Ionicons name="arrow-undo-outline" size={11} color={DesignColors.primaryBright} />
          <Text style={styles.badgeText}>Replying to {senderName ?? 'message'}</Text>
        </View>
        <Text style={styles.snippet} numberOfLines={1}>
          {snippet}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel reply"
        onPress={onClear}
        hitSlop={8}
        style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
      >
        <Ionicons name="close" size={14} color={DesignColors.onSurfaceVariant} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    paddingLeft: 0,
    marginBottom: DesignSpacing.xs + 2,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    overflow: 'hidden',
  },
  stripe: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryBright,
    marginLeft: 2,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    ...DesignTypography.labelSm,
    fontSize: 10,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  snippet: {
    ...DesignTypography.labelSm,
    fontSize: 12,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  clearButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: DesignColors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  clearButtonPressed: {
    opacity: 0.7,
  },
});