import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

import { DesignColors } from '@/constants/design';

export type PropertyVideoSurfaceProps = {
  /** HLS master playlist URL. */
  url: string;
  onError: () => void;
};

/**
 * Plays an HLS walkthrough with native controls. Mounted only after the
 * student taps play, so browsing a listing costs no video data.
 */
export function PropertyVideoSurface({ url, onError }: PropertyVideoSurfaceProps) {
  const player = useVideoPlayer(url, (p) => p.play());
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    if (status !== 'error') return;
    console.error('[PropertyVideoSurface] Playback failed:', url, error?.message);
    onError();
  }, [status, error, url, onError]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls fullscreenOptions={{ enable: true }} />
      {status === 'loading' ? <ActivityIndicator style={styles.loader} size="large" color={DesignColors.primary} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { ...StyleSheet.absoluteFill },
});
