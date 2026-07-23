import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { FeedListing, DbListing } from '@/types/feed-listing';
import { useAuth } from '@/context/auth-context';
import { useActiveClaimForListing, useHasActiveClaim } from '@/hooks/use-claim';
import { CustomAlert, useCustomAlert } from '@/components/ui/custom-alert';
import { MOCK_REVIEWS } from '@/dummy/reviews-mock';
import { ImageGalleryModal } from './image-gallery-modal';
import { PropertyHeroHeader } from './property-hero-header';
import { PropertyBottomSheet } from './property-bottom-sheet';
import { PropertyBottomBar } from './property-bottom-bar';
import { PropertyPhotos } from './property-photos';
import { PropertyLocationCard } from './property-location-card';
import { PropertyRulesCard } from './property-rules-card';
import { PropertyReviewsSection } from './property-reviews-section';
import { LocationPaymentModal } from './location-payment-modal';

const HERO_HEIGHT = 340;

export function PropertyDetailsScreen({ property, photos, dbListing }: { property: FeedListing; photos?: string[]; dbListing?: DbListing }) {
  const { profile } = useAuth();
  const { data: activeClaim, isLoading: isCheckingClaim } = useActiveClaimForListing(property.id);
  const { data: anyActiveClaim } = useHasActiveClaim();
  const { visible: alertVisible, title: alertTitle, message: alertMessage, buttons: alertButtons, showAlert, hideAlert } = useCustomAlert();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(property.isLocationUnlocked || false);

  const allPhotos = useMemo(() => {
    if (photos && photos.length > 0) return photos;
    if (property.image) return [property.image];
    return [];
  }, [property.image, photos]);

  const rules = dbListing?.rules ?? [];
  const reviews = MOCK_REVIEWS;
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const handleClaimRoom = () => {
    if (activeClaim) {
      router.push(`/property/claim-receipt?id=${property.id}`);
      return;
    }

    if (anyActiveClaim) {
      showAlert({
        title: 'Active Claim Exists',
        message: 'You already have an active claim on another property. Would you like to cancel it first?',
        buttons: [
          { label: 'Nevermind', style: 'cancel' },
          {
            label: 'Cancel Existing',
            style: 'primary',
            onPress: () => router.push(`/property/claim-receipt?id=${anyActiveClaim.listing_id}`),
          },
        ],
      });
      return;
    }

    router.push(`/property/claim-room?id=${property.id}`);
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

        <PropertyLocationCard
          latitude={property.latitude}
          longitude={property.longitude}
          locationFee={property.locationFee}
          isUnlocked={isUnlocked}
          onUnlockPress={() => setPaymentModalOpen(true)}
        />

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

        {rules.length > 0 && <PropertyRulesCard rules={rules} />}

        <PropertyReviewsSection reviews={reviews} avgRating={avgRating} />
      </PropertyBottomSheet>

      <PropertyBottomBar
        onBookTour={() => router.push(`/property/tour-scheduler?id=${property.id}`)}
        onClaimRoom={handleClaimRoom}
        hasActiveClaim={!!activeClaim}
        isCheckingClaim={isCheckingClaim}
      />

      <ImageGalleryModal
        photos={allPhotos}
        initialIndex={galleryIndex}
        visible={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      <LocationPaymentModal
        visible={paymentModalOpen}
        feeAmount={property.locationFee || 500}
        propertyTitle={property.title}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          setIsUnlocked(true);
          setPaymentModalOpen(false);
        }}
      />

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onDismiss={hideAlert}
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
  safe: { flex: 1, backgroundColor: DesignColors.surface },
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
  location: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  priceSection: { marginBottom: DesignSpacing.lg },
  priceLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, marginBottom: 4 },
  price: { fontSize: 32, fontWeight: '800', color: DesignColors.primaryBright, fontFamily, letterSpacing: -0.5 },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: DesignColors.cardBorder,
    paddingVertical: DesignSpacing.md,
    marginBottom: DesignSpacing.lg,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  statLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  overviewSection: { marginBottom: DesignSpacing.lg },
  sectionTitle: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, marginBottom: DesignSpacing.sm },
  description: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 24 },
  amenitiesSection: { marginBottom: DesignSpacing.xl },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: DesignSpacing.sm },
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
  amenityText: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily },
});
