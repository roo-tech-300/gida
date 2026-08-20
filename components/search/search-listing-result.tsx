import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { ListingSearchResult } from '@/services/search-service';

type Props = {
  listing: ListingSearchResult;
  onPress: (id: string) => void;
};

export function SearchListingResult({ listing, onPress }: Props) {
  const price = `₦${listing.price_amount.toLocaleString('en-US')}`;
  const beds = listing.number_of_bedrooms > 0 ? `${listing.number_of_bedrooms} Bed` : '';
  const baths = listing.number_of_bathrooms > 0 ? `${listing.number_of_bathrooms} Bath` : '';

  return (
    <Pressable style={styles.card} onPress={() => onPress(listing.id)}>
      {listing.primary_image ? (
        <Image source={{ uri: listing.primary_image }} style={styles.thumb} contentFit="cover" cachePolicy="disk" />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]}>
          <Ionicons name="home-outline" size={22} color={DesignColors.onSurfaceVariant} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.location} numberOfLines={1}>
            {[listing.location_landmark, listing.city].filter(Boolean).join(', ')}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.price}>{price}/yr</Text>
          {(beds || baths) && (
            <Text style={styles.meta}>
              {[beds, baths].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    marginTop: 2,
  },
  price: {
    ...DesignTypography.labelLg,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '700',
  },
  meta: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
