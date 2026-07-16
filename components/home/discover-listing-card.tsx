import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { type FeedListing } from '@/types/feed-listing';

type Props = {
  listing: FeedListing;
  liked: boolean;
  onToggleLike: (id: string) => void;
  onViewListing: (id: string) => void;
  height: number;
};

function MetaItem({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={18} color={DesignColors.primary} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

export function DiscoverListingCard({ listing, liked, onToggleLike, onViewListing, height }: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [priceAmount] = listing.price.split('/');

  return (
    <View style={[styles.card, { height }]}>
      <Image
        source={{ uri: listing.image }}
        style={[styles.image, { opacity: imageLoaded ? 1 : 0 }]}
        contentFit="cover"
        cachePolicy="disk"
        transition={400}
        onLoad={() => setImageLoaded(true)}
      />
      {!imageLoaded && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
        </View>
      )}

      <View style={styles.gradientOverlay}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="cardGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
              <Stop offset="50%" stopColor="rgba(0,0,0,0.2)" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="rgba(0,0,0,1)" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#cardGradient)" />
        </Svg>
      </View>

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <BlurView intensity={20} tint="dark" style={styles.badgeBlur} />
            <Text style={styles.badgeText}>{listing.status}</Text>
          </View>
        </View>

        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{listing.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.location}>{listing.location}</Text>
            </View>
          </View>
          <View style={styles.priceBlock}>
            <Text style={styles.price}>{priceAmount}</Text>
            <Text style={styles.priceLabel}>per year</Text>
          </View>
        </View>

        <View style={styles.metaDivider}>
          <View style={styles.metaRow}>
            {listing.beds ? <MetaItem icon="bed-outline" label={listing.beds} /> : null}
            {listing.baths ? <MetaItem icon="water-outline" label={listing.baths} /> : null}
            {listing.size ? <MetaItem icon="square-outline" label={listing.size} /> : null}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable onPress={() => onViewListing(listing.id)} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>View Listing</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onToggleLike(listing.id)}
            style={styles.likeButton}
          >
            <BlurView intensity={20} tint="dark" style={styles.likeBlur} />
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={22}
              color={liked ? DesignColors.secondary : DesignColors.onSurface}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DesignColors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: DesignSpacing.marginMobile,
    gap: DesignSpacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    overflow: 'hidden',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DesignColors.secondary,
  },
  badgeBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  badgeText: {
    ...DesignTypography.labelCaps,
    color: DesignColors.secondary,
    fontFamily,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: DesignSpacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: DesignColors.onSurface,
    fontFamily,
    lineHeight: 34,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: DesignColors.primary,
    fontFamily,
    lineHeight: 38,
    letterSpacing: -0.02,
  },
  priceLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  metaDivider: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: DesignSpacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: DesignSpacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.xl,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
  likeButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DesignRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  likeBlur: {
    ...StyleSheet.absoluteFillObject,
  },
});
