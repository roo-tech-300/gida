import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

function GalleryPhoto({ uri, onPress }: { uri: string; onPress: () => void }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Pressable onPress={onPress} style={styles.imageWrap}>
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
    </Pressable>
  );
}

export function PropertyPhotos({ photos, onImagePress }: { photos?: string[]; onImagePress?: (index: number) => void }) {
  if (!photos || photos.length === 0) {
    return (
      <View style={styles.emptySection}>
        <Ionicons name="images-outline" size={36} color={DesignColors.onSurfaceVariant} />
        <Text style={styles.emptyText}>No Photos Available</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Photos ({photos.length})</Text>
      <View style={styles.grid}>
        {photos.map((uri, index) => (
          index === 0 ? (
            <Pressable key={index} onPress={() => onImagePress?.(index)} style={styles.imageHeroWrap}>
              <Image
                source={{ uri }}
                style={styles.imageHero}
                contentFit="cover"
                cachePolicy="disk"
                transition={300}
              />
            </Pressable>
          ) : (
            <GalleryPhoto key={index} uri={uri} onPress={() => onImagePress?.(index)} />
          )
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: DesignSpacing.xl,
    paddingBottom: 80,
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
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageHeroWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: DesignRadius.sm,
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  imageHero: {
    width: '100%',
    height: '100%',
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
