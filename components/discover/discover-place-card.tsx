import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StarRating } from '@/components/ui/star-rating';
import { PlaceCreator } from '@/components/discover/place-creator';
import { DesignColors, fontFamily } from '@/constants/design';
import { getPlaceCategoryMeta } from '@/constants/place-categories';
import type { Place } from '@/types/place';
import { formatOpenStatus } from '@/utils/place-format';

type Props = {
  place: Place;
  saved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
};

export function DiscoverPlaceCard({ place, saved, onPress, onToggleSave }: Props) {
  const category = getPlaceCategoryMeta(place.category);
  const openLabel = formatOpenStatus(place.openStatus);
  const firstImage = place.images?.split(',').find((u) => u.length > 0);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageContainer}>
        {firstImage ? (
          <Image contentFit="cover" source={{ uri: firstImage }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons color={DesignColors.primaryFixed} name={category.icon} size={28} />
          </View>
        )}
        {openLabel ? (
          <View style={styles.imageBadge}>
            <View
              style={[
                styles.badgeDot,
                { backgroundColor: place.openStatus === 'open' ? DesignColors.secondary : DesignColors.error },
              ]}
            />
            <Text style={styles.badgeText}>{openLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.category}>
          {category.label}
        </Text>

        <Text numberOfLines={1} style={styles.name}>
          {place.name}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {place.area}
        </Text>

        <PlaceCreator
          creatorId={place.creatorId}
          creatorUsername={place.creatorUsername}
          creatorName={place.creatorName}
          creatorAvatarUrl={place.creatorAvatarUrl}
        />

        <View style={styles.footerRow}>
          <StarRating compact rating={place.rating} />

          <Pressable
            accessibilityLabel={saved ? `Unsave ${place.name}` : `Save ${place.name}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onToggleSave}
            style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
          >
            <Ionicons
              color={saved ? DesignColors.primary : DesignColors.onSurfaceVariant}
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  pressed: {
    opacity: 0.92,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(19, 19, 21, 0.82)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: DesignColors.onSurface,
    fontFamily,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: DesignColors.primaryFixed,
    fontFamily,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: DesignColors.textPrimary,
    fontFamily,
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  saveButtonPressed: {
    opacity: 0.7,
  },
});
