import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useIsFocused } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';

/**
 * Silent looping preview layered over a cover photo or poster.
 *
 * - `isActive`: true for the card currently filling the screen. Only active
 *   videos play; preloaded (upcoming) videos stay paused but mounted so their
 *   MP4 metadata is already fetched by FFmpeg.wasm when the user swipes to them.
 * - Cross-fades opacity between 0 and 1 so the video appears seamlessly on top
 *   of the cover photo instead of popping in after a mount delay.
 */
export function FeedVideoPreview({ uri, isActive = false }: { uri: string; isActive?: boolean }) {
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
    // Play only when active, app focused, and video is ready. Pause otherwise.
    if (isActive && isFocused && status === 'readyToPlay') {
      player.play();
    } else if (!isActive || !isFocused) {
      player.pause();
    }
  }, [isActive, isFocused, status, player]);

  useEffect(() => {
    if (status === 'error') {
      opacity.value = 0;
      console.error('[FeedVideoPreview] Preview failed, showing cover photo instead:', uri, error?.message);
    }
  }, [status, error, uri, opacity]);

  // Cross-fade opacity so the video fades in over the cover photo.
  useEffect(() => {
    const target = isActive && isFocused && status === 'readyToPlay' ? 1 : 0;
    opacity.value = withTiming(target, { duration: 300 });
  }, [isActive, isFocused, status, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!uri) return null;

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
