import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { getPlaceCategoryMeta } from '@/constants/place-categories';
import type { Place } from '@/types/place';

type Props = {
  place: Place;
  onRemove: (id: string) => void;
  onView: (id: string) => void;
};

export function SavedPlaceCard({ place, onRemove, onView }: Props) {
  const category = getPlaceCategoryMeta(place.category);
  const firstImage = place.images?.split(',')[0];

  return (
    <View style={styles.card}>
      {/* Type badge — visually distinguishes this from a property card */}
      <View style={styles.typePill}>
        <Ionicons name="compass-outline" size={12} color={DesignColors.tertiary} />
        <Text style={styles.typePillText}>Place</Text>
      </View>

      <View style={styles.imageWrap}>
        {firstImage ? (
          <Image source={{ uri: firstImage }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name={category.icon} size={40} color={DesignColors.primaryFixed} />
          </View>
        )}
        <View style={styles.overlay} />

        {/* Bookmark (remove) button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${place.name} from saved`}
          onPress={() => onRemove(place.id)}
          style={styles.saveButton}
        >
          <Ionicons name="bookmark" size={18} color={DesignColors.primary} />
        </Pressable>

        {/* Category badge */}
        <View style={styles.categoryBadge}>
          <Ionicons name={category.icon} size={12} color={DesignColors.onPrimary} />
          <Text style={styles.categoryBadgeText}>{category.label}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>{place.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.location} numberOfLines={1}>{place.area}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          {place.rating > 0 && (
            <View style={styles.metaPill}>
              <Ionicons name="star" size={13} color={DesignColors.primaryBright} />
              <Text style={styles.metaText}>{place.rating.toFixed(1)}</Text>
            </View>
          )}
          {place.address ? (
            <View style={styles.metaPill}>
              <Ionicons name="map-outline" size={13} color={DesignColors.primaryBright} />
              <Text style={styles.metaText} numberOfLines={1}>{place.address}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.areaLabel}>{place.area}, Minna</Text>
          <Pressable onPress={() => onView(place.id)} style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'visible',
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  typePill: {
    position: 'absolute',
    top: -10,
    left: DesignSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.tertiary,
    zIndex: 10,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: DesignColors.tertiary,
    fontFamily,
    letterSpacing: 0.4,
  },
  imageWrap: {
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  saveButton: {
    position: 'absolute',
    top: DesignSpacing.md,
    right: DesignSpacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.glassFill,
    zIndex: 2,
  },
  categoryBadge: {
    position: 'absolute',
    left: DesignSpacing.md,
    bottom: DesignSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: DesignColors.primary,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: DesignColors.onPrimary,
    fontFamily,
  },
  body: {
    padding: DesignSpacing.md,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleBlock: {
    flex: 1,
    gap: 3,
  },
  title: {
    ...DesignTypography.bodyLg,
    fontWeight: '700',
    color: DesignColors.onSurface,
    fontFamily,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  metaText: {
    fontSize: 12,
    color: DesignColors.onSurface,
    fontFamily,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  areaLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  viewButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: DesignColors.primary,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: DesignColors.onPrimary,
    fontFamily,
  },
});
