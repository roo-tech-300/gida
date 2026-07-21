import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { FeedListing } from '@/types/feed-listing';

export function PropertyHeroHeader({ property, photoCount, onHeroPress }: { property: FeedListing; photoCount?: number; onHeroPress?: () => void }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Pressable style={styles.heroWrap} onPress={onHeroPress}>
        <Image
          source={{ uri: property.image }}
          style={[styles.heroImage, { opacity: imageLoaded ? 1 : 0 }]}
          contentFit="cover"
          cachePolicy="disk"
          transition={400}
          onLoad={() => setImageLoaded(true)}
        />
        {!imageLoaded && (
          <View style={styles.heroLoader}>
            <ActivityIndicator size="large" color={DesignColors.primary} />
          </View>
        )}
        <View style={styles.heroOverlay} />
        <View style={styles.heroBadges}>
          <View style={styles.heroBadge}>
            <Ionicons name="camera-outline" size={14} color={DesignColors.onSurface} />
            <Text style={styles.heroBadgeText}>{photoCount ?? property.photoCount} PHOTOS</Text>
          </View>
          {property.hasVirtualTour && (
            <View style={styles.heroBadge}>
              <Ionicons name="videocam-outline" size={14} color={DesignColors.onSurface} />
              <Text style={styles.heroBadgeText}>VIRTUAL TOUR</Text>
            </View>
          )}
        </View>
      </Pressable>

      <View style={[styles.header, { top: insets.top }]}>
        <BackButton />
        <Text style={styles.headerTitle}>GIDA</Text>
        <Pressable style={styles.headerBtn}>
          <Ionicons name="share-outline" size={22} color={DesignColors.onSurface} />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 340,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DesignColors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroBadges: {
    position: 'absolute',
    bottom: DesignSpacing.md,
    left: DesignSpacing.marginMobile,
    flexDirection: 'row',
    gap: DesignSpacing.sm,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: DesignRadius.sm,
  },
  heroBadgeText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
