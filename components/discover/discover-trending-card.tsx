import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, fontFamily } from '@/constants/design';
import { getPlaceCategoryMeta } from '@/constants/place-categories';
import type { Place } from '@/types/place';
import { formatOpenStatus, formatPriceRange } from '@/utils/place-format';

type Props = {
  place: Place;
  saved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
};

export function DiscoverTrendingCard({ place, saved, onPress, onToggleSave }: Props) {
  const category = getPlaceCategoryMeta(place.category);
  const openLabel = formatOpenStatus(place.openStatus);
  const firstImage = place.images?.split(',').find((u) => u.length > 0);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        {firstImage ? (
          <Image contentFit="cover" source={{ uri: firstImage }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons color={DesignColors.primaryFixed} name={category.icon} size={28} />
          </View>
        )}

        <View style={styles.topBadgeRow}>
          <View style={styles.categoryBadge}>
            <Text numberOfLines={1} style={styles.categoryBadgeText}>
              {category.label}
            </Text>
          </View>

          <Pressable
            accessibilityLabel={saved ? `Unsave ${place.name}` : `Save ${place.name}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={(event: any) => {
              event?.stopPropagation?.();
              event?.preventDefault?.();
              onToggleSave();
            }}
            style={styles.saveButton}
          >
            <Ionicons
              color={saved ? DesignColors.primary : '#FFFFFF'}
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={16}
            />
          </Pressable>
        </View>

        {openLabel ? (
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: place.openStatus === 'open' ? DesignColors.secondary : DesignColors.error },
              ]}
            />
            <Text style={styles.statusText}>{openLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.name}>
          {place.name}
        </Text>

        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={styles.metaArea}>
            {place.area}
          </Text>
          <Text style={styles.metaBullet}>•</Text>
          <Text style={styles.metaPrice}>{formatPriceRange(place.priceRange)}</Text>
        </View>

        <View style={styles.ratingRow}>
          <Ionicons color="#FFB800" name="star" size={13} />
          <Text style={styles.ratingVal}>{place.rating.toFixed(1)}</Text>
          <Text style={styles.ratingCount}>({place.ratingCount})</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLow,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
  },
  imageWrap: {
    width: '100%',
    height: 124,
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
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  topBadgeRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(19, 19, 21, 0.75)',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DesignColors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily,
  },
  saveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(19, 19, 21, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(19, 19, 21, 0.85)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: DesignColors.onSurface,
    fontFamily,
  },
  body: {
    padding: 10,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: DesignColors.textPrimary,
    fontFamily,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaArea: {
    fontSize: 12,
    color: DesignColors.textSecondary,
    fontFamily,
    maxWidth: 120,
  },
  metaBullet: {
    fontSize: 11,
    color: DesignColors.outline,
  },
  metaPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignColors.primaryFixed,
    fontFamily,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: '700',
    color: DesignColors.textPrimary,
    fontFamily,
  },
  ratingCount: {
    fontSize: 11,
    color: DesignColors.textSecondary,
    fontFamily,
  },
});
