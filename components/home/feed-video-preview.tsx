import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useIsFocused } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';

/**
 * Silent looping preview layered over a cover photo or poster. The feed mounts
 * it only on the visible card; the property page's video tour on its player
 * and thumbnails. Until it can play (or if it fails) the image underneath
 * stays visible.
 */
export function FeedVideoPreview({ uri }: { uri: string }) {
  const isFocused = useIsFocused();
  const opacity = useSharedValue(0);
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.loop = true;
    // Don't interrupt whatever the student is listening to.
    p.audioMixingMode = 'mixWithOthers';
  });
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    if (isFocused) player.play();
    else player.pause();
  }, [isFocused, player]);

  useEffect(() => {
    if (status === 'readyToPlay') opacity.value = withTiming(1, { duration: 300 });
    if (status === 'error') {
      opacity.value = 0;
      console.error('[FeedVideoPreview] Preview failed, showing cover photo instead:', uri, error?.message);
    }
  }, [status, error, uri, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]} pointerEvents="none">
      <VideoView player={player} style={styles.video} contentFit="cover" nativeControls={false} />
    </Animated.View>
  );
}

export function FeedVideoBadge() {
  return (
    <View style={styles.badge}>
      <Ionicons name="videocam" size={12} color={DesignColors.onPrimaryContainer} />
      <Text style={styles.badgeText}>Video tour</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Explicit size: on web a <video> doesn't stretch to fill from offsets alone.
  video: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: DesignColors.primaryContainer,
  },
  badgeText: { ...DesignTypography.labelCaps, color: DesignColors.onPrimaryContainer, fontFamily },
});
