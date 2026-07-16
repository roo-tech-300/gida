import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { FeedListing } from '@/types/feed-listing';
import { ImageGalleryModal } from './image-gallery-modal';
import { PropertyHeroHeader } from './property-hero-header';
import { PropertyBottomSheet } from './property-bottom-sheet';
import { PropertyBottomBar } from './property-bottom-bar';
import { PropertyPhotos } from './property-photos';

const HERO_HEIGHT = 340;

export function PropertyDetailsScreen({ property, photos }: { property: FeedListing; photos?: string[] }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const allPhotos = useMemo(() => {
    if (photos && photos.length > 0) return photos;
    if (property.image) return [property.image];
    return [];
  }, [property.image, photos]);

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <PropertyHeroHeader property={property} onHeroPress={() => allPhotos.length > 0 && openGallery(0)} />

      <PropertyBottomSheet heroHeight={HERO_HEIGHT}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{property.status.toUpperCase()}</Text>
        </View>

        <Text style={styles.title}>{property.title}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.location}>{property.location}</Text>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>ASKING PRICE</Text>
          <Text style={styles.price}>{property.price}</Text>
        </View>

        <View style={styles.statsRow}>
          {property.beds ? <StatItem label="BEDROOMS" value={property.beds} /> : null}
          {property.baths ? <StatItem label="BATHROOMS" value={property.baths} /> : null}
          {property.size ? <StatItem label="INTERIOR" value={property.size} /> : null}
          {property.floor ? <StatItem label="FLOOR" value={property.floor} /> : null}
        </View>

        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Property Overview</Text>
          <Text style={styles.description}>{property.description}</Text>
        </View>

        <View style={styles.amenitiesSection}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {property.amenities.map((amenity) => (
              <View key={amenity} style={styles.amenityCard}>
                <Ionicons name="checkmark-circle" size={20} color={DesignColors.primary} />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        <PropertyPhotos photos={photos} onImagePress={(index) => openGallery(index)} />
      </PropertyBottomSheet>

      <PropertyBottomBar onBookTour={() => router.push(`/property/tour-scheduler?id=${property.id}`)} />

      <ImageGalleryModal
        photos={allPhotos}
        initialIndex={galleryIndex}
        visible={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DesignColors.surface,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(74, 225, 118, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: DesignSpacing.sm,
  },
  statusText: {
    ...DesignTypography.labelSm,
    color: DesignColors.secondary,
    fontFamily,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    ...DesignTypography.headlineLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '800',
    marginBottom: DesignSpacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: DesignSpacing.lg,
  },
  location: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  priceSection: {
    marginBottom: DesignSpacing.lg,
  },
  priceLabel: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: DesignColors.primaryBright,
    fontFamily,
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: DesignColors.cardBorder,
    paddingVertical: DesignSpacing.md,
    marginBottom: DesignSpacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  statLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  overviewSection: {
    marginBottom: DesignSpacing.lg,
  },
  sectionTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    marginBottom: DesignSpacing.sm,
  },
  description: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 24,
  },
  amenitiesSection: {
    marginBottom: DesignSpacing.xl,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    width: '48%',
    backgroundColor: DesignColors.surfaceContainerLow,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.md,
    borderRadius: DesignRadius.sm,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  amenityText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
});
