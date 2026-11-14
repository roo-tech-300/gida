import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useListingVideos } from '@/hooks/use-listing-videos';
import { isReadyVideo } from '@/types/listing-video';
import { PropertyVideoPlayer } from './property-video-player';

/** Video tour section for students. Renders nothing for listings without videos. */
export function PropertyVideos({ listingId }: { listingId: string }) {
  const { data, isError, refetch } = useListingVideos(listingId);
  const videos = useMemo(() => (data ?? []).filter(isReadyVideo), [data]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = videos[Math.min(selectedIndex, videos.length - 1)];

  if (isError) {
    return (
      <Pressable style={styles.errorRow} onPress={() => refetch()} accessibilityRole="button">
        <Ionicons name="videocam-off-outline" size={18} color={DesignColors.onSurfaceVariant} />
        <Text style={styles.errorText}>Couldn&apos;t load the video tour. Tap to retry.</Text>
      </Pressable>
    );
  }
  if (!selected) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Video Tour{videos.length > 1 ? ` (${videos.length})` : ''}</Text>
      <PropertyVideoPlayer key={selected.id} video={selected} />
      {videos.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {videos.map((video, index) => (
            <Pressable
              key={video.id}
              onPress={() => setSelectedIndex(index)}
              style={[styles.thumb, video.id === selected.id && styles.thumbActive]}
              accessibilityRole="button"
              accessibilityLabel={`Video ${index + 1}`}
            >
              <Image source={{ uri: video.posterUrl }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="disk" />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: DesignSpacing.sm, marginBottom: DesignSpacing.lg },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily },
  thumbs: { gap: DesignSpacing.sm },
  thumb: {
    width: 96,
    height: 54,
    borderRadius: DesignRadius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: DesignColors.transparent,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  thumbActive: { borderColor: DesignColors.primaryBright },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    padding: DesignSpacing.md,
    marginBottom: DesignSpacing.lg,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  errorText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
});
