import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ImageGalleryModal } from '@/components/property/image-gallery-modal';
import { PropertyPhotos } from '@/components/property/property-photos';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { mapDbToFeedListing, type DbListing } from '@/types/feed-listing';
import { useListingPhotos } from '@/hooks/use-listing-photos';

type Props = {
  listing: DbListing;
};

/**
 * Lodge details shown inside the pod join sheet (and reused by the claim
 * wizard): photos with a full-screen gallery, location, key facts, amenities,
 * and the listing description. Photo failures degrade gracefully and never
 * block the sheet.
 */
export function PodListingSection({ listing }: Props) {
  const feed = mapDbToFeedListing(listing);
  const { data: photos } = useListingPhotos(listing.id);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryVisible, setGalleryVisible] = useState(false);

  const photoList = photos ?? (listing.primary_image ? [listing.primary_image] : []);

  const facts = [
    { label: feed.beds, icon: 'bed-outline' as const },
    { label: feed.baths, icon: 'water-outline' as const },
    { label: feed.size, icon: 'square-outline' as const },
  ].filter((fact) => fact.label.length > 0);

  return (
    <View style={styles.section}>
      <PropertyPhotos
        photos={photoList}
        onImagePress={(index) => {
          setGalleryIndex(index);
          setGalleryVisible(true);
        }}
      />

      <ImageGalleryModal
        photos={photoList}
        initialIndex={galleryIndex}
        visible={galleryVisible}
        onClose={() => setGalleryVisible(false)}
      />

      {feed.location ? (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.locationText}>{feed.location}</Text>
        </View>
      ) : null}

      {facts.length > 0 ? (
        <View style={styles.factsRow}>
          {facts.map((fact) => (
            <View key={fact.label} style={styles.factChip}>
              <Ionicons name={fact.icon} size={14} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.factText}>{fact.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {feed.amenities.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>AMENITIES</Text>
          <View style={styles.amenityChips}>
            {feed.amenities.map((amenity) => (
              <View key={amenity} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {feed.description ? (
        <Text style={styles.description} numberOfLines={5} ellipsizeMode="tail">
          {feed.description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: DesignSpacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  locationText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  factsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  factChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  factText: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignColors.onSurface,
    fontFamily,
  },
  sectionLabel: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  amenityChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
    marginTop: DesignSpacing.xs,
  },
  amenityChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  amenityText: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
