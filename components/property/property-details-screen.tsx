import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { FeedListing, DbListing } from '@/types/feed-listing';
import { useCreditForListing } from '@/hooks/use-liquidity';
import { useTourBookings } from '@/hooks/use-tour-bookings';
import { useReviews, calculateAverageRating } from '@/hooks/use-reviews';
import { useReviewEligibility } from '@/hooks/use-review-eligibility';
import { useQueryClient } from '@tanstack/react-query';
import { formatTourDate } from '@/utils/tour-availability';
import { ClaimRoomModal } from '@/components/claim/claim-room-modal';
import { ImageGalleryModal } from './image-gallery-modal';
import { PropertyHeroHeader } from './property-hero-header';
import { PropertyBottomSheet } from './property-bottom-sheet';
import { PropertyBottomBar } from './property-bottom-bar';
import { PropertyPhotos } from './property-photos';
import { PropertyKeyAmenities, getToggleAmenities } from './property-key-amenities';
import { PropertyAmenitiesList } from './property-amenities-list';
import { BookTourModal } from './book-tour-modal';
import { PropertyRulesCard } from './property-rules-card';
import { PropertyReviewsSection } from './property-reviews-section';
import { AddReviewForm } from './add-review-form';

const HERO_HEIGHT = 340;

export function PropertyDetailsScreen({ property, photos, dbListing }: { property: FeedListing; photos?: string[]; dbListing?: DbListing }) {
  const queryClient = useQueryClient();
  const { data: credit, isLoading: isCheckingCredit } = useCreditForListing(property.id);
  const { data: myTours = [] } = useTourBookings();
  const { data: reviews = [], isLoading: isLoadingReviews, isError: isReviewsError, error: reviewsError, refetch: refetchReviews } = useReviews(property.id);
  const { data: reviewEligibility } = useReviewEligibility(property.id);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);

  const allPhotos = useMemo(() => {
    if (photos && photos.length > 0) return photos;
    if (property.image) return [property.image];
    return [];
  }, [property.image, photos]);

  const hasReviews = reviews.length > 0;

  const rules = dbListing?.rules ?? [];
  const keyAmenities = dbListing ? getToggleAmenities(dbListing) : [];
  const avgRating = calculateAverageRating(reviews);

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const isPaid = !!credit && (credit.status === 'paid_unmatched' || credit.status === 'matched' || credit.status === 'subletting');
  const isSolo = !!credit && credit.target_occupancy === 1;
  const isClaimable = !credit || credit.status === 'expired';

  let ctaLabel = 'Claim Spot';
  let ctaIcon: keyof typeof Ionicons.glyphMap = 'enter-outline';
  const isSingleOccupancy = dbListing?.max_roommates === 1;
  let onCtaPress: () => void = () => {
    if (isSingleOccupancy) {
      router.push(`/property/solo-claim?id=${property.id}`);
    } else {
      setClaimModalOpen(true);
    }
  };

  if (credit && !isClaimable) {
    if (isPaid) {
      ctaLabel = isSolo ? 'View Booking' : 'Go to Lobby';
      ctaIcon = isSolo ? 'checkmark-circle-outline' : 'people-outline';
      onCtaPress = () => router.push(isSolo ? `/property/booking?id=${credit.id}` : '/property/lobby');
    } else {
      ctaLabel = 'Pay Now';
      ctaIcon = 'card-outline';
      onCtaPress = () => router.push(`/property/pay-slot?id=${credit.id}`);
    }
  }

  const activeTour = myTours.find(
    (tour) => tour.listing_id === property.id && (tour.status === 'pending_payment' || tour.status === 'booked'),
  );

  const handleAssistedTour = () => {
    setTourModalOpen(false);
    if (activeTour) {
      router.push(
        `/property/tour-pass?id=${property.id}&bookingId=${activeTour.id}&date=${encodeURIComponent(formatTourDate(activeTour.scheduled_date))}&time=${encodeURIComponent(activeTour.scheduled_time)}`,
      );
      return;
    }
    router.push(`/property/tour-scheduler?id=${property.id}`);
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

        <View style={styles.priceSection}><Text style={styles.price}>{property.price}</Text></View>
        <View style={styles.statsRow}>
          {property.beds ? <StatItem label="BEDROOMS" value={property.beds} /> : null}
          {property.baths ? <StatItem label="BATHROOMS" value={property.baths} /> : null}
          {property.size ? <StatItem label="INTERIOR" value={property.size} /> : null}
          {property.floor ? <StatItem label="FLOOR" value={property.floor} /> : null}
        </View>

        <PropertyKeyAmenities amenities={keyAmenities} />

        <PropertyPhotos photos={photos} onImagePress={(index) => openGallery(index)} />

        {property.description ? (
          <View style={styles.overviewSection}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleBar} />
              <Text style={styles.sectionTitle}>PROPERTY OVERVIEW</Text>
            </View>
            <Text style={styles.description}>{property.description}</Text>
          </View>
        ) : null}

        <PropertyRulesCard rules={rules} />

        <PropertyAmenitiesList amenities={property.amenities} />

        {/* Show review form if user has paid for a slot */}
        {isPaid && reviewEligibility?.canReview && (
          <AddReviewForm listingId={property.id} />
        )}

        {isPaid && reviewEligibility && !reviewEligibility.canReview ? (
          <View style={styles.reviewLimitCard}>
            <Text style={styles.reviewLimitTitle}>Review limit reached</Text>
            <Text style={styles.reviewLimitText}>
              {reviewEligibility.paid
                ? `You have used all 3 review slots for this property.`
                : 'You need a paid slot on this property before reviewing.'}
            </Text>
          </View>
        ) : null}

        {isReviewsError ? (
          <View style={styles.reviewErrorCard}>
            <Text style={styles.reviewErrorTitle}>Could not load reviews</Text>
            <Text style={styles.reviewErrorText}>
              {reviewsError instanceof Error ? reviewsError.message : 'Something went wrong while loading reviews.'}
            </Text>
            <Pressable
              style={styles.reviewRetryButton}
              onPress={() => {
                void queryClient.invalidateQueries({ queryKey: ['reviews', property.id] });
                void refetchReviews();
              }}
            >
              <Text style={styles.reviewRetryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoadingReviews && hasReviews ? <PropertyReviewsSection reviews={reviews} avgRating={avgRating} /> : null}

        {!isLoadingReviews && hasReviews ? (
          <Pressable style={styles.viewAllReviewsButton} onPress={() => router.push(`/property/reviews/${property.id}`)}>
            <Text style={styles.viewAllReviewsText}>View all reviews</Text>
            <Ionicons name="chevron-forward" size={16} color={DesignColors.primary} />
          </Pressable>
        ) : null}
      </PropertyBottomSheet>

      <PropertyBottomBar
        ctaLabel={ctaLabel}
        ctaIcon={ctaIcon}
        onCtaPress={onCtaPress}
        onVisitProperty={() => setTourModalOpen(true)}
        showSpinner={isCheckingCredit && !credit}
      />

      <ImageGalleryModal
        photos={allPhotos}
        initialIndex={galleryIndex}
        visible={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      <BookTourModal
        visible={tourModalOpen}
        propertyId={property.id}
        propertyTitle={property.title}
        propertyLocation={property.location}
        latitude={property.latitude}
        longitude={property.longitude}
        locationFee={property.locationFee}
        onClose={() => setTourModalOpen(false)}
        onAssistedTour={handleAssistedTour}
      />

      <ClaimRoomModal visible={claimModalOpen} listingId={property.id} onClose={() => setClaimModalOpen(false)} />
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
    backgroundColor: DesignColors.successContainer,
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
  overviewSection: { marginBottom: DesignSpacing.xl },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, marginBottom: DesignSpacing.md },
  sectionTitleBar: { width: 3, height: 14, borderRadius: 2, backgroundColor: DesignColors.primaryBright },
  sectionTitle: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1.4 },
  description: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 24 },
  reviewLimitCard: {
    marginBottom: DesignSpacing.lg,
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    gap: DesignSpacing.xs,
  },
  reviewLimitTitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  reviewLimitText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 22,
  },
  viewAllReviewsButton: {
    marginBottom: DesignSpacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: DesignSpacing.md,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  viewAllReviewsText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.primary,
    fontFamily,
    fontWeight: '700',
  },
  reviewErrorCard: {
    marginBottom: DesignSpacing.lg,
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLow,
    gap: DesignSpacing.sm,
  },
  reviewErrorTitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  reviewErrorText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 22,
  },
  reviewRetryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    borderRadius: DesignRadius.sm,
    backgroundColor: DesignColors.primary,
  },
  reviewRetryText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
});
