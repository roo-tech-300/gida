import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { formatNaira } from '@/utils/format-naira';
import { FEED_PREVIEW_DWELL_MS } from '@/constants/listing-video';
import { useDwell } from '@/hooks/use-dwell';
import { spotsLeftLabel } from '@/utils/spots-left';
import type { FeedListing } from '@/types/feed-listing';

import { FeedVideoBadge, FeedVideoPreview } from './feed-video-preview';

const IMAGE_HEIGHT = 196;
const MAX_CHIPS = 3;

type Props = {
  listing: FeedListing;
  liked: boolean;
  /** Spots still open; the card only mentions it when scarce. */
  spotsLeft?: number;
  /** True for the one card mostly in view; only it may play its video preview. */
  isActive?: boolean;
  onToggleLike: (id: string) => void;
  onPress: (id: string) => void;
};

function capitalise(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/** Chips answer "can I share, and what comes with it?" before the student opens the listing. */
function chipsFor(listing: FeedListing): string[] {
  const share = (listing.propertyTier ?? 1) > 1 ? `Shared by ${listing.propertyTier}` : 'Just you';
  return [share, ...listing.amenities].slice(0, MAX_CHIPS);
}

function PlaceCardBase({ listing, liked, spotsLeft, isActive = false, onToggleLike, onPress }: Props) {
  // Wait briefly so fast scrolling never starts a download for every card passed.
  const showPreview = useDwell(isActive && !!listing.videoPreviewUrl, FEED_PREVIEW_DWELL_MS);
  const chips = chipsFor(listing);
  const scarcity = spotsLeftLabel(spotsLeft);
  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => pressed && styles.pressed}
        onPress={() => onPress(listing.id)}
        accessibilityRole="button"
        accessibilityLabel={`${listing.title}, ${formatNaira(listing.pricePerPerson)} per person per year`}
        testID={`place-card-${listing.id}`}
      >
        <View style={styles.imageWrap}>
          <Image source={{ uri: listing.image }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={250} />
          {showPreview && listing.videoPreviewUrl ? <FeedVideoPreview uri={listing.videoPreviewUrl} /> : null}
          {listing.videoPreviewUrl ? <View style={styles.videoBadge}><FeedVideoBadge /></View> : null}
          <View style={styles.status}>
            <View style={[styles.statusDot, scarcity === 'Full' && styles.statusDotFull]} />
            <Text style={styles.statusText} testID={`place-status-${listing.id}`}>{scarcity ?? capitalise(listing.status)}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatNaira(listing.pricePerPerson)}</Text>
            <Text style={styles.priceNote}>per person · per year</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.location} numberOfLines={1}>{listing.location}</Text>
          </View>
          <View style={styles.chips}>
            {chips.map((chip, index) => (
              <View key={chip} style={[styles.chip, index === 0 && styles.chipFirst]}>
                <Text style={[styles.chipText, index === 0 && styles.chipTextFirst]} numberOfLines={1}>{chip}</Text>
              </View>
            ))}
          </View>
        </View>
      </Pressable>

      {/* Sibling of the card button, not a child: nested buttons are invalid on web. */}
      <Pressable
        style={styles.heart}
        onPress={() => onToggleLike(listing.id)}
        accessibilityRole="button"
        accessibilityLabel={liked ? 'Remove from saved' : 'Save this place'}
        hitSlop={8}
        testID={`place-heart-${listing.id}`}
      >
        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? DesignColors.tertiary : DesignColors.onSurface} />
      </Pressable>
    </View>
  );
}

export const PlaceCard = memo(PlaceCardBase);

const styles = StyleSheet.create({
  card: { marginHorizontal: DesignSpacing.marginMobile, marginBottom: DesignSpacing.lg },
  pressed: { opacity: 0.85 },
  imageWrap: { height: IMAGE_HEIGHT, borderRadius: DesignRadius.xl, overflow: 'hidden', backgroundColor: DesignColors.surfaceContainerHigh },
  status: {
    position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: DesignColors.scrimHeavy,
  },
  videoBadge: { position: 'absolute', left: 12, bottom: 12, height: 26, justifyContent: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DesignColors.success },
  statusDotFull: { backgroundColor: DesignColors.error },
  statusText: { ...DesignTypography.labelSm, color: DesignColors.textPrimary, fontFamily, fontWeight: '700' },
  heart: {
    position: 'absolute', top: 10, right: 10, width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.scrim,
  },
  body: { paddingTop: DesignSpacing.md, gap: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: DesignColors.primaryFixed, fontFamily, letterSpacing: -0.4 },
  priceNote: { ...DesignTypography.labelSm, color: DesignColors.outline, fontFamily },
  title: { ...DesignTypography.titleMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: DesignSpacing.sm },
  chip: {
    paddingHorizontal: 10, height: 28, justifyContent: 'center', borderRadius: 14,
    backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  chipFirst: { backgroundColor: DesignColors.primaryTint, borderColor: DesignColors.primaryTintBorder },
  chipText: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, fontWeight: '600' },
  chipTextFirst: { color: DesignColors.primaryFixed },
});
