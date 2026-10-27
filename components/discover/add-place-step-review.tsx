import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import { getPlaceCategoryMeta } from '@/constants/place-categories';
import type { PlaceDraft } from '@/types/place';

type Props = {
  draft: PlaceDraft;
  photos: string[];
};

export function AddPlaceStepReview({ draft, photos }: Props) {
  const category = getPlaceCategoryMeta(draft.category);
  const hasCoords = draft.latitude != null && draft.longitude != null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Your Place</Text>
      <Text style={styles.subtitle}>Check your details before publishing to Discover.</Text>

      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.categoryBadge}>
            <Ionicons name={category.icon} size={14} color={DesignColors.primaryFixed} />
            <Text style={styles.categoryLabel}>{category.label}</Text>
          </View>
        </View>

        <Text style={styles.name}>{draft.name}</Text>
        <Text style={styles.locationMeta}>
          {draft.area}
          {draft.address ? ` • ${draft.address}` : ''}
        </Text>

        <View style={styles.coordsRow}>
          <Ionicons
            name={hasCoords ? 'location' : 'location-outline'}
            size={16}
            color={hasCoords ? DesignColors.secondary : DesignColors.textSecondary}
          />
          <Text style={styles.coordsText}>
            {hasCoords
              ? `GPS: ${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
              : 'No GPS coordinates added'}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.descriptionLabel}>Description</Text>
        <Text style={styles.descriptionText}>{draft.description}</Text>

        {photos.length > 0 ? (
          <View style={styles.photosSection}>
            <Text style={styles.descriptionLabel}>Photos ({photos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
              {photos.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.photoThumb} />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.sm,
    gap: DesignSpacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: DesignColors.textPrimary,
    fontFamily,
  },
  subtitle: {
    fontSize: 12,
    color: DesignColors.textSecondary,
    fontFamily,
    marginBottom: DesignSpacing.sm,
  },
  card: {
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DesignRadius.sm,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: DesignColors.onSurface,
    fontFamily,
    textTransform: 'uppercase',
  },
  priceTier: {
    fontSize: 13,
    fontWeight: '800',
    color: DesignColors.primaryFixed,
    fontFamily,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: DesignColors.textPrimary,
    fontFamily,
    letterSpacing: -0.3,
  },
  locationMeta: {
    fontSize: 13,
    color: DesignColors.textSecondary,
    fontFamily,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  coordsText: {
    fontSize: 12,
    color: DesignColors.textSecondary,
    fontFamily,
  },
  divider: {
    height: 1,
    backgroundColor: DesignColors.cardBorder,
    marginVertical: 4,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: DesignColors.textPrimary,
    fontFamily,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  photosSection: {
    marginTop: 6,
    gap: 6,
  },
  photosRow: {
    gap: 8,
  },
  photoThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
});
