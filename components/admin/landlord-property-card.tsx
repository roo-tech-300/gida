import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MetaPill } from '@/components/admin/inventory-card';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { LandlordListing } from '@/services/landlord-service';

const LEASE_LABEL: Record<string, string> = {
  per_annum: 'Per Academic Year',
  per_semester: 'Per Semester',
};

export function LandlordPropertyCard({ property }: { property: LandlordListing }) {
  const location = [property.location_landmark, property.city].filter(Boolean).join(', ');
  const statusLabel = property.status ? property.status.replace(/_/g, ' ').toUpperCase() : 'AVAILABLE';

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {property.primary_image ? (
          <Image source={property.primary_image} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={40} color={DesignColors.onSurfaceVariant} />
          </View>
        )}
        <View style={styles.overlay} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{property.title}</Text>
          {location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.location}>{location}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          <MetaPill
            icon="bed-outline"
            label={property.number_of_bedrooms > 0 ? `${property.number_of_bedrooms} Beds` : 'Studio'}
          />
          <MetaPill
            icon="water-outline"
            label={property.number_of_bathrooms > 0 ? `${property.number_of_bathrooms} Baths` : 'N/A'}
          />
          {property.size_sqft ? (
            <MetaPill icon="square-outline" label={`${property.size_sqft.toLocaleString('en-US')} sqft`} />
          ) : null}
        </View>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>{LEASE_LABEL[property.lease_term] ?? 'Per Academic Year'}</Text>
            <Text style={styles.price}>₦{property.price_amount.toLocaleString('en-US')}</Text>
          </View>
          <Pressable
            style={styles.viewButton}
            onPress={() => router.push(`/admin/listing/${property.id}` as never)}
          >
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
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  imageWrap: {
    height: 256,
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DesignColors.scrimLight,
  },
  badge: {
    position: 'absolute',
    left: DesignSpacing.md,
    bottom: DesignSpacing.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: DesignColors.primaryContainer,
    zIndex: 2,
  },
  badgeText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
    letterSpacing: 1,
  },

  body: {
    gap: DesignSpacing.md,
    padding: DesignSpacing.lg,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderTopWidth: 1,
    borderTopColor: DesignColors.borderSoft,
  },
  titleBlock: { gap: 6 },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
    paddingVertical: DesignSpacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DesignSpacing.md,
  },
  priceLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  price: {
    ...DesignTypography.headlineMd,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '800',
  },
  viewButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: DesignRadius.xl,
    backgroundColor: DesignColors.primaryContainer,
  },
  viewButtonText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
});
