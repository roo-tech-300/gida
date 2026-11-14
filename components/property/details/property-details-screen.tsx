import { useMemo, useRef, useState } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClaimRoomModal } from '@/components/claim/claim-room-modal';
import { CancelReservationModal } from '@/components/reservation/cancel-reservation-modal';
import { ShareListingModal } from '@/components/messages/share-listing-modal';
import { DesignColors, DesignSpacing } from '@/constants/design';
import { useListingVideos } from '@/hooks/use-listing-videos';
import { usePropertyCta } from '@/hooks/use-property-cta';
import { usePropertySave } from '@/hooks/use-property-save';
import { usePropertyTour } from '@/hooks/use-property-tour';
import { useSpotsLeft } from '@/hooks/use-spots-left';
import type { DbListing, FeedListing } from '@/types/feed-listing';
import { extraFeatures, includedAmenities } from '@/utils/included-amenities';
import { isReadyVideo } from '@/types/listing-video';
import { BookTourModal } from '../book-tour-modal';
import { ImageGalleryModal } from '../image-gallery-modal';
import { InviteResponseModal } from '../invite-response-modal';
import { PropertyAmenitiesList } from '../property-amenities-list';
import { PropertyRulesCard } from '../property-rules-card';
import { PropertyVideos } from '../property-videos';
import { BAR_HEIGHT, HERO_HEIGHT, SHEET_OVERLAP } from './constants';
import { PropertyAbout } from './property-about';
import { PropertyBottomBar } from './property-bottom-bar';
import { PropertyCancelLink } from './property-cancel-link';
import { PropertyFactsStrip } from './property-facts-strip';
import { PropertyHero } from './property-hero';
import { PropertyIncludedChips } from './property-included-chips';
import { PropertyPhotoGrid } from './property-photo-grid';
import { PropertyPriceCard } from './property-price-card';
import { PropertyReviewsBlock } from './property-reviews-block';
import { PropertyTitleBlock } from './property-title-block';
import { PropertyTopBar } from './property-top-bar';
import { PropertyTourCard } from './property-tour-card';

type Props = { property: FeedListing; photos?: string[]; dbListing?: DbListing };

export function PropertyDetailsScreen({ property, photos, dbListing }: Props) {
  const insets = useSafeAreaInsets();
  const [scrollY] = useState(() => new Animated.Value(0));
  const scrollRef = useRef<ScrollView>(null);
  const videosY = useRef(0);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const save = usePropertySave(property.id);
  const tour = usePropertyTour(property, dbListing);
  const spotsLeft = useSpotsLeft([property.id])[property.id];
  const cta = usePropertyCta(property, dbListing, spotsLeft);
  const { data: videos } = useListingVideos(property.id);
  const hasVideo = (videos ?? []).some(isReadyVideo);

  const allPhotos = useMemo(() => (photos && photos.length > 0 ? photos : property.image ? [property.image] : []), [photos, property.image]);
  const chips = useMemo(() => includedAmenities(dbListing), [dbListing]);
  const extras = useMemo(() => extraFeatures(property.amenities, chips), [property.amenities, chips]);

  const scrollToVideos = () => {
    const y = HERO_HEIGHT - SHEET_OVERLAP + videosY.current - (insets.top + 64);
    scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
  };

  // A student who already holds a spot shouldn't be told the place is "Full".
  const holdsSpot = ['pay', 'review', 'rejected', 'household', 'booking'].includes(cta.cta.state);
  const variant = ['booking', 'review', 'rejected'].includes(cta.cta.state) ? 'secondary' : cta.cta.state === 'full' ? 'disabled' : 'primary';

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        ref={scrollRef as never}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: Platform.OS !== 'web' })}
        contentContainerStyle={{ paddingBottom: BAR_HEIGHT + insets.bottom + DesignSpacing.lg }}
      >
        <PropertyHero photos={allPhotos} hasVideo={hasVideo} onPhotoPress={setGalleryIndex} onVideoPress={scrollToVideos} />
        <View style={styles.sheet}>
          <PropertyTitleBlock property={property} spotsLeft={holdsSpot ? undefined : spotsLeft} />
          <PropertyPriceCard property={property} />
          {cta.cta.state === 'pay' && cta.canCancel ? <PropertyCancelLink onPress={cta.openCancel} /> : null}
          <PropertyFactsStrip property={property} />
          <PropertyIncludedChips amenities={chips} />
          {tour.available ? <PropertyTourCard hasActiveTour={!!tour.activeTour} onPress={tour.openTour} /> : null}
          <View onLayout={(e) => { videosY.current = e.nativeEvent.layout.y; }}>
            <PropertyVideos listingId={property.id} />
          </View>
          <PropertyAbout description={property.description} />
          <PropertyPhotoGrid photos={allPhotos} onPhotoPress={setGalleryIndex} />
          <PropertyRulesCard rules={dbListing?.rules ?? []} />
          <PropertyAmenitiesList amenities={extras} />
          <PropertyReviewsBlock listingId={property.id} isPaid={cta.isPaid} />
        </View>
      </Animated.ScrollView>

      <PropertyTopBar scrollY={scrollY} title={property.title} saved={save.isSaved} onToggleSave={save.toggle} onShare={() => setShareOpen(true)} />
      <PropertyBottomBar summary={cta.summary} label={cta.cta.label} variant={variant} pending={cta.isPending} onPress={cta.onPress} />

      <ImageGalleryModal photos={allPhotos} initialIndex={galleryIndex ?? 0} visible={galleryIndex !== null} onClose={() => setGalleryIndex(null)} />
      <BookTourModal
        visible={tour.open}
        propertyId={property.id}
        propertyTitle={property.title}
        propertyLocation={property.location}
        latitude={property.latitude}
        longitude={property.longitude}
        locationFee={property.locationFee}
        enableGuided={(dbListing?.enable_guided_tour ?? true) || !!tour.activeTour}
        enableSelfGuided={dbListing?.enable_self_guided_tour ?? true}
        onClose={tour.closeTour}
        onAssistedTour={tour.goAssistedTour}
      />
      <CancelReservationModal visible={cta.cancelOpen} creditId={cta.creditId} placeTitle={property.title} onClose={cta.closeCancel} />
      <ClaimRoomModal visible={cta.claimOpen} listingId={property.id} onClose={cta.closeClaim} />
      <InviteResponseModal visible={cta.inviteOpen} invitation={cta.invitation} onClose={cta.closeInvite} />
      <ShareListingModal visible={shareOpen} listing={property} onClose={() => setShareOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DesignColors.surface },
  sheet: {
    marginTop: -SHEET_OVERLAP,
    paddingTop: DesignSpacing.lg + 2,
    paddingHorizontal: DesignSpacing.marginMobile,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: DesignColors.surface,
  },
});
