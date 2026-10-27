import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
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
  const photos = place.images?.split(',').filter((uri) => uri.length > 0) ?? [];
  const [firstImage] = photos;

  return (
    <Pressable
      accessibilityLabel={onPressImage ? `Open photo gallery for ${place.name}` : undefined}
      accessibilityRole={onPressImage ? 'button' : undefined}
      disabled={!onPressImage}
      onPress={onPressImage}
      style={styles.container}
    >
      {firstImage ? (
        <Image contentFit="cover" source={{ uri: firstImage }} style={styles.heroImage} />
      ) : (
        <View style={[styles.heroImage, styles.placeholder]} />
      )}
      <View pointerEvents="box-none" style={styles.heroOverlay}>
        <SafeAreaView edges={['top']} style={styles.topBar}>
          <BackButton />
          <View style={styles.heroActions}>
            <Pressable
              accessibilityLabel={saved ? `Remove ${place.name} from saved` : `Save ${place.name}`}
              accessibilityRole="button"
              hitSlop={12}
              onPress={onToggleSave}
              style={styles.actionButton}
            >
              <Ionicons color="#FFFFFF" name={saved ? 'bookmark' : 'bookmark-outline'} size={22} />
            </Pressable>
            <Pressable
              accessibilityLabel={`Share ${place.name}`}
              accessibilityRole="button"
              hitSlop={12}
              onPress={onShare}
              style={styles.actionButton}
            >
              <Ionicons color="#FFFFFF" name="share-outline" size={22} />
            </Pressable>
          </View>
        </SafeAreaView>
        <View style={styles.heroDetails}>
          <Text style={styles.heroTitle}>{place.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.heroSubtitle}>{place.area}</Text>
            {photos.length > 0 && onPressImage ? (
              <Pressable
                accessibilityLabel={`View all ${photos.length} photos of ${place.name}`}
                accessibilityRole="button"
                onPress={onPressImage}
                style={({ pressed }) => [styles.photoPill, pressed && styles.photoPillPressed]}
              >
                <Ionicons color="#FFFFFF" name="images-outline" size={13} />
                <Text style={styles.photoPillLabel}>
                  {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <PlaceCreator
            creatorId={place.creatorId}
            creatorUsername={place.creatorUsername}
            creatorName={place.creatorName}
            creatorAvatarUrl={place.creatorAvatarUrl}
          />
        </View>
      </View>
    </Pressable>
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  photoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  photoPillPressed: {
    opacity: 0.75,
  },
  photoPillLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#FFFFFF',
    fontFamily,
  },
  heroActions: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSpacing.md,
    paddingBottom: DesignSpacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.scrim,
  },
});
