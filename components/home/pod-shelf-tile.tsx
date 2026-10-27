import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import type { RecommendedPod } from '@/types/pod-recommendation';
import { formatNairaCompact } from '@/utils/currency';
import { podOpenSlotStatus } from '@/utils/liquidity-math';
import { podPerPersonPrice } from '@/utils/pod-ranking';

type Props = {
  pod: RecommendedPod;
  onPress: () => void;
  /** Single-pod shelves use a wide, roomier layout. */
  hero?: boolean;
};

export function PodShelfTile({ pod, onPress, hero = false }: Props) {
  const { available, occupied } = podOpenSlotStatus(pod);
  const total = pod.target_occupancy ?? 0;
  const share = podPerPersonPrice(pod);
  const seatLabel = `${available} seat${available === 1 ? '' : 's'} open`;
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageUri = pod.listing.primary_image ?? '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pod.listing.title}: ${occupied} of ${total} filled, ${formatNairaCompact(share)} per year each, ${seatLabel}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, hero && styles.heroTile, pressed && styles.pressed]}
    >
      <View style={[styles.imageWrap, hero && styles.heroImageWrap]}>
        {imageUri ? (
          <>
            <Image
              source={{ uri: imageUri }}
              style={[styles.image, hero && styles.heroImage, { opacity: imageLoaded ? 1 : 0 }]}
              contentFit="cover"
              cachePolicy="disk"
              transition={300}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="small" color={DesignColors.primary} />
              </View>
            )}
          </>
        ) : (
          <View style={[styles.fallback, hero && styles.heroFallback]}>
            <Ionicons name="home-outline" size={hero ? 44 : 26} color={DesignColors.onSurfaceVariant} />
          </View>
        )}
        <View style={styles.gradientOverlay}>
          <Svg height="100%" width="100%">
            <Defs>
              <LinearGradient id="podTileGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={DesignColors.transparent} stopOpacity="0" />
                <Stop offset="45%" stopColor={DesignColors.scrimLight} stopOpacity="0.35" />
                <Stop offset="100%" stopColor={DesignColors.surfaceContainerLowest} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#podTileGradient)" />
          </Svg>
        </View>
      </View>

      <View style={[styles.chipWrap, hero && styles.heroChipWrap]}>
        <View style={[styles.seatChip, hero && styles.heroSeatChip]}>
          <Text style={[styles.seatChipText, hero && styles.heroSeatChipText]}>{seatLabel}</Text>
        </View>
      </View>

      <View style={[styles.info, hero && styles.heroInfo]}>
        <Text style={[styles.title, hero && styles.heroTitle]} numberOfLines={2}>
          {pod.listing.title}
        </Text>
        <View style={[styles.locationRow, hero && styles.heroLocationRow]}>
          <Ionicons name="location-outline" size={hero ? 15 : 12} color={DesignColors.onSurfaceVariant} />
          <Text
            style={[styles.location, hero && styles.heroLocation]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {`${pod.listing.location_landmark}, ${pod.listing.city}`}
          </Text>
        </View>
        <Text style={[styles.price, hero && styles.heroPrice]}>
          {formatNairaCompact(share)}
          <Text style={styles.priceSuffix}>/yr each</Text>
        </Text>
        <Text style={[styles.filled, hero && styles.heroFilled]}>{occupied} of {total} filled</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: DesignColors.borderFaint,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  heroTile: {},
  pressed: { opacity: 0.92 },
  imageWrap: { ...StyleSheet.absoluteFill, backgroundColor: DesignColors.surfaceContainerHigh },
  heroImageWrap: { ...StyleSheet.absoluteFill },
  image: { ...StyleSheet.absoluteFill },
  heroImage: { ...StyleSheet.absoluteFill },
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: DesignColors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFallback: {},
  gradientOverlay: { ...StyleSheet.absoluteFill },
  chipWrap: { position: 'absolute', top: DesignSpacing.sm, left: DesignSpacing.sm },
  heroChipWrap: { top: DesignSpacing.md, left: DesignSpacing.md },
  seatChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.successContainer,
    borderWidth: 1,
    borderColor: DesignColors.success,
  },
  heroSeatChip: { paddingHorizontal: 12, paddingVertical: 5 },
  seatChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: DesignColors.success,
    fontFamily,
  },
  heroSeatChipText: { fontSize: 12 },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: DesignSpacing.marginMobile,
    paddingBottom: DesignSpacing.lg,
    gap: DesignSpacing.xs,
  },
  heroInfo: {
    padding: DesignSpacing.lg,
    paddingBottom: DesignSpacing.xl,
    gap: DesignSpacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: DesignColors.onSurface,
    fontFamily,
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroLocationRow: { gap: 8 },
  location: {
    fontSize: 11,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  heroLocation: { fontSize: 13 },
  price: {
    fontSize: 13,
    fontWeight: '800',
    color: DesignColors.primaryFixed,
    fontFamily,
  },
  heroPrice: { fontSize: 17 },
  priceSuffix: {
    fontSize: 10,
    fontWeight: '500',
    color: DesignColors.onSurfaceVariant,
  },
  filled: {
    fontSize: 11,
    fontWeight: '600',
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  heroFilled: { fontSize: 13 },
});
