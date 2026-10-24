import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import type { Place } from '@/types/place';

type Props = {
  place: Place;
  saved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
};

export function PlaceDetailHero({ place, saved, onToggleSave, onShare }: Props) {
  const firstImage = place.images?.split(',').find((u) => u.length > 0);

  return (
    <View style={styles.container}>
      {firstImage ? (
        <Image contentFit="cover" source={{ uri: firstImage }} style={styles.heroImage} />
      ) : (
        <View style={[styles.heroImage, styles.placeholder]} />
      )}
      <View style={styles.heroOverlay}>
        <View style={styles.heroDetails}>
          <Text style={styles.heroTitle}>{place.name}</Text>
          <Text style={styles.heroSubtitle}>{place.area}</Text>
        </View>
        <View style={styles.heroActions}>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onToggleSave}>
            <Ionicons
              color={saved ? DesignColors.primary : DesignColors.onPrimary}
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
            />
          </Pressable>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onShare}>
            <Ionicons color={DesignColors.onPrimary} name="share-outline" size={20} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: DesignSpacing.md,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: DesignColors.onSurface,
    fontFamily,
  },
  heroSubtitle: {
    fontSize: 14,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginTop: DesignSpacing.xs,
  },
  heroActions: {
    position: 'absolute',
    top: DesignSpacing.md,
    right: DesignSpacing.md,
    flexDirection: 'row',
    gap: DesignSpacing.sm,
  },
});
