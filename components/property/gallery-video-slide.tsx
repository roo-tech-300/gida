import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import type { ReadyListingVideo } from '@/types/listing-video';
import { PropertyVideoSurface } from './property-video-surface';

/**
 * Full-screen video slide inside the media gallery. The player is only mounted
 * while the slide is active, so swiping past a video costs no data. Shows the
 * poster while inactive (or if playback fails).
 */
export function GalleryVideoSlide({ video, isActive }: { video: ReadyListingVideo; isActive: boolean }) {
  const [failed, setFailed] = useState(false);

  if (!isActive || failed) {
    return (
      <View style={styles.slide}>
        <Image source={{ uri: video.posterUrl }} style={styles.poster} contentFit="contain" cachePolicy="disk" />
        {failed ? <Text style={styles.error}>Couldn&apos;t play this video.</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.slide}>
      <PropertyVideoSurface url={video.hlsUrl} onError={() => setFailed(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  poster: { width: '100%', height: '100%' },
  error: {
    position: 'absolute',
    bottom: 24,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
