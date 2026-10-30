import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { ReadyListingVideo } from '@/types/listing-video';
import { formatVideoDuration } from '@/utils/media-url';
import { FeedVideoPreview } from '@/components/home/feed-video-preview';
import { PropertyVideoSurface } from './property-video-surface';

/** Give it `key={video.id}` so switching videos starts again from the poster. */
export function PropertyVideoPlayer({ video }: { video: ReadyListingVideo }) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <View style={styles.frame}>
      {playing && !failed ? (
        <PropertyVideoSurface url={video.hlsUrl} onError={() => setFailed(true)} />
      ) : (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            setFailed(false);
            setPlaying(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={failed ? 'Retry video' : 'Play video tour'}
        >
          <Image source={{ uri: video.posterUrl }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="disk" transition={200} />
          {/* Silent 8s loop over the poster until the student taps play. */}
          {failed ? null : <FeedVideoPreview uri={video.previewUrl} />}
          <View style={styles.scrim} />
          <View style={styles.center}>
            <View style={styles.playButton}>
              <Ionicons name={failed ? 'refresh' : 'play'} size={30} color={DesignColors.onPrimaryContainer} />
            </View>
            {failed ? <Text style={styles.errorText}>Couldn&apos;t play the video. Tap to retry.</Text> : null}
          </View>
          {video.durationSeconds != null ? (
            <View style={styles.duration}>
              <Text style={styles.durationText}>{formatVideoDuration(video.durationSeconds)}</Text>
            </View>
          ) : null}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: DesignRadius.md,
    overflow: 'hidden',
    backgroundColor: DesignColors.scrimDeep,
  },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: DesignColors.scrimLight },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
    backgroundColor: DesignColors.primaryContainer,
  },
  errorText: { ...DesignTypography.bodyMd, color: DesignColors.textPrimary, fontFamily, fontWeight: '600' },
  duration: {
    position: 'absolute',
    right: DesignSpacing.sm,
    bottom: DesignSpacing.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: DesignColors.scrimHeavy,
  },
  durationText: { fontSize: 12, fontWeight: '700', color: DesignColors.textPrimary, fontFamily },
});
