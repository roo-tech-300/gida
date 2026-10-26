import { Ionicons } from '@expo/vector-icons';
import { StarRating } from '@/components/ui/star-rating';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, fontFamily } from '@/constants/design';
import { getPlaceCategoryMeta } from '@/constants/place-categories';
import type { Place } from '@/types/place';
import { formatOpenStatus, formatPriceRange, formatRatingCount } from '@/utils/place-format';

type Props = {
  place: Place;
  rating: number;
  ratingCount: number;
};

export function PlaceDetailContent({ place, rating, ratingCount }: Props) {
  const category = getPlaceCategoryMeta(place.category);
  const openLabel = formatOpenStatus(place.openStatus);

  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <View style={styles.categoryPill}>
          <Ionicons color={DesignColors.primaryFixed} name={category.icon} size={13} />
          <Text style={styles.categoryLabel}>{category.label}</Text>
        </View>
        {place.verified && (
          <View style={styles.verifiedPill}>
            <Ionicons color={DesignColors.success} name="checkmark-circle" size={13} />
            <Text style={styles.verifiedLabel}>Verified</Text>
          </View>
        )}
      </View>

      <Text style={styles.name}>{place.name}</Text>

      <View style={styles.ratingRow}>
        <StarRating rating={rating} showValue size={14} />
        <Text style={styles.metaText}>{formatRatingCount(ratingCount)} ratings</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.metaText}>{formatPriceRange(place.priceRange)}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons color={DesignColors.textSecondary} name="location-outline" size={16} />
        <Text style={styles.infoText}>{place.address}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons color={DesignColors.textSecondary} name="time-outline" size={16} />
        <Text style={styles.infoText}>{place.hours}</Text>
        {openLabel.length > 0 && (
          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                place.openStatus === 'open' ? styles.statusOpen : styles.statusClosed,
              ]}
            />
            <Text
              style={[
                styles.statusText,
                place.openStatus === 'open' ? styles.statusTextOpen : styles.statusTextClosed,
              ]}
            >
              {openLabel}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.body}>{place.description}</Text>
      </View>

      {place.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Good to know</Text>
          <View style={styles.tags}>
            {place.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagLabel}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
  },
  categoryLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: DesignColors.primaryFixed,
    fontFamily,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: DesignColors.successContainer,
  },
  verifiedLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: DesignColors.success,
    fontFamily,
  },
  name: {
    marginTop: 2,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: DesignColors.textPrimary,
    fontFamily,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16,
    color: DesignColors.textSecondary,
    fontFamily,
  },
  dot: {
    fontSize: 12,
    color: DesignColors.textSecondary,
    fontFamily,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusOpen: {
    backgroundColor: DesignColors.success,
  },
  statusClosed: {
    backgroundColor: DesignColors.danger,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    fontFamily,
  },
  statusTextOpen: {
    color: DesignColors.success,
  },
  statusTextClosed: {
    color: DesignColors.danger,
  },
  section: {
    marginTop: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: DesignColors.textPrimary,
    fontFamily,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.glassSoft,
  },
  tagLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});