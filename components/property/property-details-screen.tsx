import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { FeedListing, DbListing } from '@/types/feed-listing';
import { useCreditForListing, useExpireSlotCredit } from '@/hooks/use-liquidity';
import { useTourBookings } from '@/hooks/use-tour-bookings';
import { formatTourDate } from '@/utils/tour-availability';
import { ClaimRoomModal } from '@/components/claim/claim-room-modal';
import { useAppToast } from '@/components/ui/toast-card';
import { MOCK_REVIEWS } from '@/dummy/reviews-mock';
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
import { ApplicationStatusCard } from './application-status-card';
import { CancelApplicationModal } from './cancel-application-modal';

const HERO_HEIGHT = 340;

export function PropertyDetailsScreen({ property, photos, dbListing }: { property: FeedListing; photos?: string[]; dbListing?: DbListing }) {
  const { data: credit, isLoading: isCheckingCredit } = useCreditForListing(property.id);
  const { mutateAsync: cancelCredit, isPending: isCancelling } = useExpireSlotCredit();
  const { data: myTours = [] } = useTourBookings();
  const { showToast } = useAppToast();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const allPhotos = useMemo(() => {
    if (photos && photos.length > 0) return photos;
    if (property.image) return [property.image];
    return [];
  }, [property.image, photos]);

  const rules = dbListing?.rules ?? [];
  const keyAmenities = dbListing ? getToggleAmenities(dbListing) : [];
  const avgRating = MOCK_REVIEWS.length === 0 ? 0 : MOCK_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / MOCK_REVIEWS.length;

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const isPaid = !!credit && (credit.status === 'paid_unmatched' || credit.status === 'matched' || credit.status === 'subletting');
  const isSolo = !!credit && credit.target_occupancy === 1;
  const isClaimable = !credit || credit.status === 'expired';
  const hasActiveApplication = !!credit && credit.status === 'booked_pending_claim';

  const handleCancelApplication = async () => {
    if (!credit) return;
    try {
      const cancelled = await cancelCredit(credit.id);
      if (!cancelled) {
        showToast({ message: "Couldn't cancel your application. Check your connection and try again.", type: 'error' });
        return;
      }
      setCancelModalOpen(false);
      showToast({ message: 'Application cancelled. You can claim this spot again.', type: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel application.';
      showToast({ message, type: 'error' });
    }
  };

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

        {hasActiveApplication && (
          <ApplicationStatusCard deadline={credit.payment_deadline} onCancelPress={() => setCancelModalOpen(true)} />
        )}

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

        <PropertyReviewsSection reviews={MOCK_REVIEWS} avgRating={avgRating} />
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

      <CancelApplicationModal
        visible={cancelModalOpen}
        listingTitle={property.title}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelApplication}
        isPending={isCancelling}
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
});
