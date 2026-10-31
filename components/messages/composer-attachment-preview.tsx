/* eslint-disable react-hooks/refs */
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { ListingAttachment } from '@/types/messages';

type Props = {
  attachment: ListingAttachment;
  onClear?: () => void;
};

export function ComposerAttachmentPreview({ attachment, onClear }: Props) {
  const animRef = useRef(new Animated.Value(0));
  const anim = animRef.current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 110,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [anim]);

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
      {attachment.image ? (
        <Image source={{ uri: attachment.image }} style={styles.thumbnail} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.thumbnail, styles.fallback]}>
          <Ionicons name="business-outline" size={20} color={DesignColors.onSurfaceVariant} />
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.badgeRow}>
          <Ionicons name="link-outline" size={11} color={DesignColors.primaryBright} />
          <Text style={styles.badgeText}>Attached listing</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {attachment.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.price}>{attachment.price}</Text>
          {attachment.location ? (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.location} numberOfLines={1}>
                {attachment.location}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      {onClear ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove attached listing"
          onPress={onClear}
          hitSlop={8}
          style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
        >
          <Ionicons name="close" size={14} color={DesignColors.onSurfaceVariant} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    marginBottom: DesignSpacing.xs + 2,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: DesignRadius.sm,
    backgroundColor: DesignColors.surfaceContainerHighest,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
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
  title: {
    ...DesignTypography.labelLg,
    fontSize: 13,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  price: {
    ...DesignTypography.labelSm,
    fontSize: 11,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '700',
  },
  dot: {
    fontSize: 10,
    color: DesignColors.outline,
  },
  location: {
    ...DesignTypography.labelSm,
    fontSize: 11,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
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
