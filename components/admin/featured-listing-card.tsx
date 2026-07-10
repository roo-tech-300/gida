import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { type AdminListing } from '@/services/adminService';

type Props = {
  listing: AdminListing | null;
};

function formatPrice(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`;
  return `₦${amount}`;
}

export function FeaturedListingCard({ listing }: Props) {
  if (!listing) {
    return (
      <Pressable style={styles.promptCard}>
        <BlurView intensity={20} tint="dark" style={styles.glassBlur} />
        <View style={styles.promptContent}>
          <View style={styles.promptIconWrap}>
            <Ionicons name="star-outline" size={28} color={DesignColors.primary} />
          </View>
          <Text style={styles.promptTitle}>Gain More Visibility</Text>
          <Text style={styles.promptDesc}>
            Feature your best listing to get it showcased to more students looking for housing.
          </Text>
          <View style={styles.promptCta}>
            <Text style={styles.promptCtaText}>Try Featured Listing</Text>
            <Ionicons name="arrow-forward" size={16} color={DesignColors.primary} />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cardOuter}>
        <BlurView intensity={20} tint="dark" style={styles.glassBlur} />
        <View style={styles.cardInner}>
          <View style={styles.imageWrap}>
            <Image
              source={
                listing.primary_image
                  ? { uri: listing.primary_image }
                  : require('@/dummy/images/houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.png')
              }
              style={styles.image}
            />
            <View style={styles.gradientWrap}>
              <Svg width="100%" height="100%" style={styles.gradientSvg}>
                <Defs>
                  <LinearGradient id="featuredGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
                    <Stop offset="50%" stopColor="rgba(0,0,0,0.6)" stopOpacity="0.6" />
                    <Stop offset="100%" stopColor="rgba(0,0,0,0.85)" stopOpacity="0.85" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#featuredGrad)" />
              </Svg>
            </View>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
            <View style={styles.bottomRow}>
              <View>
                <Text style={styles.listingTitle}>{listing.title}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.locationText}>
                    {listing.location_landmark}, {listing.city}
                  </Text>
                </View>
              </View>
              <View style={styles.pricePill}>
                <Text style={styles.priceText}>{formatPrice(listing.price_amount)}</Text>
                <Text style={styles.priceUnit}>/yr</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: DesignSpacing.md,
  },
  cardOuter: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(24,24,28,0.6)',
    padding: 8,
  },
  glassBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  cardInner: {
    borderRadius: 26,
    overflow: 'hidden',
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 10,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradientWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  gradientSvg: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: DesignColors.primary,
    borderRadius: DesignRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: DesignColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: DesignColors.onPrimary,
    fontFamily,
    textTransform: 'uppercase',
  },
  bottomRow: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  listingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DesignColors.onSurface,
    fontFamily,
    lineHeight: 26,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontFamily,
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: DesignColors.primary,
    fontFamily,
  },
  priceUnit: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontFamily,
  },
  promptCard: {
    borderRadius: DesignRadius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(24,24,28,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  promptContent: {
    padding: DesignSpacing.xl,
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  promptIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(79,70,229,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(195,192,255,0.2)',
  },
  promptTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  promptDesc: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    lineHeight: 20,
  },
  promptCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: DesignSpacing.sm,
  },
  promptCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignColors.primary,
    fontFamily,
  },
});
