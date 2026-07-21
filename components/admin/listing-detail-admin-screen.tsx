import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { FeedListing, DbListing } from '@/types/feed-listing';
import { dbToListingForm } from '@/types/feed-listing';
import { deleteListing } from '@/services/listing-service';
import { useCreateListingForm } from '@/context/create-listing-context';
import { ImageGalleryModal } from '@/components/property/image-gallery-modal';
import { PropertyHeroHeader } from '@/components/property/property-hero-header';
import { PropertyBottomSheet } from '@/components/property/property-bottom-sheet';
import { PropertyPhotos } from '@/components/property/property-photos';
import { ListingDeleteModal } from './listing-delete-modal';

const HERO_HEIGHT = 340;

export function ListingDetailAdminScreen({ property, photos, dbListing }: { property: FeedListing; photos?: string[]; dbListing: DbListing }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { prefillForEdit } = useCreateListingForm();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showDelete, setShowDelete] = useState(false);

  const allPhotos = useMemo(() => {
    if (photos && photos.length > 0) return photos;
    if (property.image) return [property.image];
    return [];
  }, [property.image, photos]);

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: () => deleteListing(property.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', property.id] });
      router.back();
    },
  });

  const handleEdit = () => {
    const formData = dbToListingForm(dbListing);
    formData.step5.galleryImages = photos || [];
    prefillForEdit(formData, property.id);
    router.push('/admin/create-listing-core-specs' as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <PropertyHeroHeader property={property} photoCount={allPhotos.length} onHeroPress={() => allPhotos.length > 0 && openGallery(0)} />

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

      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, DesignSpacing.md) }]}>
        <Pressable style={styles.editBtn} onPress={handleEdit}>
          <Ionicons name="create-outline" size={20} color={DesignColors.onPrimaryContainer} />
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={() => setShowDelete(true)}>
          <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>

      <ImageGalleryModal
        photos={allPhotos}
        initialIndex={galleryIndex}
        visible={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      <ListingDeleteModal
        visible={showDelete}
        listingTitle={property.title}
        isDeleting={deleteMutation.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
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
    backgroundColor: '#000000',
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
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.md,
    backgroundColor: '#1a1a1e',
    borderTopWidth: 1,
    borderTopColor: 'DesignColors.cardBorder',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    paddingVertical: 14,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.primaryContainer,
  },
  editText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    paddingVertical: 14,
    borderRadius: DesignRadius.lg,
    backgroundColor: 'rgba(255,77,77,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.3)',
  },
  deleteText: {
    ...DesignTypography.bodyMd,
    color: '#ff4d4d',
    fontFamily,
    fontWeight: '700',
  },
});
