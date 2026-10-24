import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StarRating } from '@/components/ui/star-rating';
import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import { PLACE_CATEGORY_MAP } from '@/constants/place-categories';
import type { Place } from '@/types/place';
import { formatOpenStatus, formatPriceRange } from '@/utils/place-format';

type Props = {
  place: Place;
  saved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
  onDirections: () => void;
};

export function DiscoverPlaceCard({ place, saved, onPress, onToggleSave, onDirections }: Props) {
  const category = PLACE_CATEGORY_MAP[place.category];
  const openLabel = formatOpenStatus(place.openStatus);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {place.image ? (
        <Image contentFit="cover" source={place.image} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons color={DesignColors.primaryFixed} name={category.icon} size={28} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.category}>
            {category.label}
          </Text>
          <Pressable
            accessibilityLabel={saved ? `Unsave ${place.name}` : `Save ${place.name}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onToggleSave}
          >
            <Ionicons
              color={saved ? DesignColors.primary : DesignColors.onSurfaceVariant}
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
            />
          </Pressable>
        </View>

        <Text numberOfLines={1} style={styles.name}>
          {place.name}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {place.area} · {formatPriceRange(place.priceRange)}
          {openLabel ? ` · ${openLabel}` : ''}
        </Text>
        <StarRating count={place.ratingCount} rating={place.rating} showValue />

        <Pressable
          accessibilityLabel={`Get directions to ${place.name}`}
          accessibilityRole="button"
          onPress={onDirections}
          style={styles.directions}
        >
          <Ionicons color={DesignColors.primaryFixed} name="navigate-outline" size={14} />
          <Text style={styles.directionsLabel}>Directions</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  pressed: {
    opacity: 0.92,
  },
  image: {
    width: 92,
    height: 92,
    borderRadius: 14,
    backgroundColor: DesignColors.primaryTint,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: DesignColors.primaryFixed,
    fontFamily,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: DesignColors.textPrimary,
    fontFamily,
  },
  meta: {
    fontSize: 12,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  directions: {
    marginTop: DesignSpacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  directionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignColors.primaryFixed,
    fontFamily,
  },
});
