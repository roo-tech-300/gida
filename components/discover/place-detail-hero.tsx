import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import type { Place } from '@/types/place';
import { PlaceCreator } from '@/components/discover/place-creator';

type Props = {
  place: Place;
  saved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
  onPressImage?: () => void;
};

export function PlaceDetailHero({ place, saved, onToggleSave, onShare, onPressImage }: Props) {
  const firstImage = place.images?.split(',').find((u) => u.length > 0);

  return (
    <View style={styles.container}>
      {firstImage ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open photo gallery for ${place.name}`}
          onPress={onPressImage}
          style={styles.heroImage}
        >
          <Image contentFit="cover" source={{ uri: firstImage }} style={styles.fill} />
        </Pressable>
      ) : (
        <View style={[styles.heroImage, styles.placeholder]} />
      )}
      <View style={styles.heroOverlay}>
        <View style={styles.heroDetails}>
          <Text style={styles.heroTitle}>{place.name}</Text>
          <Text style={styles.heroSubtitle}>{place.area}</Text>
          <PlaceCreator
            creatorId={place.creatorId}
            creatorUsername={place.creatorUsername}
            creatorName={place.creatorName}
            creatorAvatarUrl={place.creatorAvatarUrl}
          />
        </View>
        <View style={styles.heroActions}>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={onToggleSave} style={styles.actionButton}>
            <Ionicons color="#FFFFFF" name={saved ? 'bookmark' : 'bookmark-outline'} size={24} />
          </Pressable>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={onShare} style={styles.actionButton}>
            <Ionicons color="#FFFFFF" name="share-outline" size={24} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 320,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  fill: {
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
    padding: DesignSpacing.lg,
    paddingBottom: DesignSpacing.xl,
    gap: DesignSpacing.xs,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: DesignColors.onSurface,
    fontFamily,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  heroActions: {
    position: 'absolute',
    top: DesignSpacing.md,
    right: DesignSpacing.md,
    flexDirection: 'row',
    gap: DesignSpacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});
