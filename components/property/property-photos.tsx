import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { type GalleryMedia, mediaKey } from '@/types/gallery-media';

function MediaTile({ item, hero, onPress }: { item: GalleryMedia; hero?: boolean; onPress: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const uri = item.type === 'photo' ? item.uri : item.video.posterUrl;

  return (
    <Pressable onPress={onPress} style={hero ? styles.imageHeroWrap : styles.imageWrap}>
      <Image
        source={{ uri }}
        style={[styles.image, { opacity: loaded ? 1 : 0 }]}
        contentFit="cover"
        cachePolicy="disk"
        transition={300}
        onLoad={() => setLoaded(true)}
      />
      {!loaded && (
        <View style={styles.imageLoader}>
          <ActivityIndicator size="small" color={DesignColors.primary} />
        </View>
      )}
      {item.type === 'video' ? (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={16} color={DesignColors.onPrimaryContainer} />
        </View>
      ) : null}
    </Pressable>
  );
}

export function PropertyPhotos({ media, onMediaPress }: { media: GalleryMedia[]; onMediaPress?: (index: number) => void }) {
  if (media.length === 0) {
    return (
      <View style={styles.emptySection}>
        <Ionicons name="images-outline" size={36} color={DesignColors.onSurfaceVariant} />
        <Text style={styles.emptyText}>No Photos Available</Text>
      </View>
    );
  }

  const hasVideos = media.some((item) => item.type === 'video');

  return (
    <View style={styles.section}>
      <Text style={styles.title}>
        {hasVideos ? `Photos & Videos (${media.length})` : `Photos (${media.length})`}
      </Text>
      <View style={styles.grid}>
        {media.map((item, index) => (
          <MediaTile
            key={mediaKey(item, index)}
            item={item}
            hero={index === 0}
            onPress={() => onMediaPress?.(index)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: DesignSpacing.xl,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    marginBottom: DesignSpacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  imageWrap: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: DesignRadius.sm,
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryContainer,
  },
  imageHeroWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: DesignRadius.sm,
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
