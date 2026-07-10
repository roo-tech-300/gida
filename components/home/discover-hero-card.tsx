import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { type PropertyListing } from '@/dummy/listings-mock';

export function DiscoverHeroCard({
  featured,
}: {
  featured: PropertyListing;
}) {
  return (
    <View style={styles.heroCardStack}>
      <View style={styles.backCardA} />
      <View style={styles.backCardB} />

      <View style={styles.heroCard}>
        <View style={styles.heroImage}>
          <Image source={featured.image} style={styles.imageFill} contentFit="cover" />
          <View style={styles.heroOverlay} />
          <HeroHeader status={featured.status} />
          <HeroFooter featured={featured} />
        </View>
      </View>
    </View>
  );
}

function HeroHeader({ status }: { status: string }) {
  return (
    <View style={styles.heroTopRow}>
      <View style={styles.newBadge}>
        <View style={styles.pulseDot} />
        <Text style={styles.newBadgeText}>{status}</Text>
      </View>
      <Pressable style={styles.favoriteButton}>
        <Ionicons name="heart-outline" size={18} color={DesignColors.onSurface} />
      </Pressable>
    </View>
  );
}

function HeroFooter({ featured }: { featured: PropertyListing }) {
  return (
    <View style={styles.heroBottomBlock}>
      <View style={styles.heroCopy}>
        <Text style={styles.heroTitle}>{featured.title}</Text>
        <LocationRow location={featured.location} />
      </View>

      <View style={styles.heroBottomRow}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceText}>{featured.price}</Text>
          <StatsRow featured={featured} />
        </View>

        <Pressable style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LocationRow({ location }: { location: string }) {
  return (
    <View style={styles.locationRow}>
      <Ionicons name="location-outline" size={14} color={DesignColors.onSurfaceVariant} />
      <Text style={styles.heroLocation}>{location}</Text>
    </View>
  );
}

function StatsRow({ featured }: { featured: PropertyListing }) {
  return (
    <View style={styles.statsRow}>
      <StatItem icon="bed-outline" label={featured.beds} />
      <StatItem icon="water-outline" label={featured.baths} />
      <StatItem icon="resize-outline" label={featured.size} />
    </View>
  );
}

function StatItem({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={14} color={DesignColors.onSurface} />
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCardStack: {
    position: 'relative',
    minHeight: 640,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backCardA: {
    position: 'absolute',
    inset: 0,
    borderRadius: 32,
    backgroundColor: DesignColors.glassFill,
    opacity: 0.38,
    transform: [{ scale: 0.98 }, { translateX: 8 }, { translateY: 8 }],
  },
  backCardB: {
    position: 'absolute',
    inset: 0,
    borderRadius: 32,
    backgroundColor: DesignColors.glassFill,
    opacity: 0.2,
    transform: [{ scale: 0.96 }, { translateX: 16 }, { translateY: 16 }],
  },
  heroCard: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  heroImage: {
    minHeight: 610,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  imageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19, 19, 21, 0.18)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: DesignSpacing.lg,
    zIndex: 1,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(74, 225, 118, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DesignColors.secondary,
  },
  newBadgeText: {
    ...DesignTypography.labelSm,
    color: DesignColors.secondary,
    fontFamily,
    fontWeight: '700',
    letterSpacing: 1,
  },
  favoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottomBlock: {
    gap: DesignSpacing.lg,
    padding: DesignSpacing.lg,
    zIndex: 1,
  },
  heroCopy: {
    gap: 8,
  },
  heroTitle: {
    ...DesignTypography.headlineLg,
    color: '#ffffff',
    fontFamily,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLocation: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  heroBottomRow: {
    gap: DesignSpacing.md,
  },
  priceBlock: {
    gap: DesignSpacing.sm,
  },
  priceText: {
    ...DesignTypography.headlineLg,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  statText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  viewDetailsButton: {
    alignSelf: 'flex-start',
    backgroundColor: DesignColors.primaryContainer,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: DesignRadius.xl,
  },
  viewDetailsText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
});
