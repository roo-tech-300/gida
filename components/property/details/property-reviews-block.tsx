import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import { calculateAverageRating, useReviews } from '@/hooks/use-reviews';
import { useReviewEligibility } from '@/hooks/use-review-eligibility';
import { PropertyReviewsSection } from '../property-reviews-section';
import { SectionLabel } from './section-label';
import { WriteReviewSheet } from './write-review-sheet';

const PREVIEW_COUNT = 2;

/** Rating summary and the latest reviews first; writing a review is a button that opens a sheet. */
export function PropertyReviewsBlock({ listingId, isPaid }: { listingId: string; isPaid: boolean }) {
  const { data: reviews = [], isLoading, isError, error, refetch } = useReviews(listingId);
  const { data: eligibility } = useReviewEligibility(listingId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const average = calculateAverageRating(reviews);

  if (isLoading) return null;

  if (isError) {
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorTitle}>Could not load reviews</Text>
        <Text style={styles.errorText}>{error instanceof Error ? error.message : 'Something went wrong while loading reviews.'}</Text>
        <Pressable accessibilityRole="button" style={styles.retry} onPress={() => void refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const canWrite = isPaid && eligibility?.canReview;

  return (
    <View style={styles.section}>
      <SectionLabel
        right={
          reviews.length > 0 ? (
            <Pressable accessibilityRole="link" onPress={() => router.push(`/property/reviews/${listingId}`)} hitSlop={8}>
              <Text style={styles.link}>View all ›</Text>
            </Pressable>
          ) : undefined
        }
      >
        REVIEWS
      </SectionLabel>
      {reviews.length > 0 ? (
        <>
          <View style={styles.summary}>
            <Text style={styles.average}>{average.toFixed(1)}</Text>
            <View style={styles.summaryText}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Ionicons key={n} name={n <= Math.round(average) ? 'star' : 'star-outline'} size={15} color={DesignColors.rating} />
                ))}
              </View>
              <Text style={styles.count}>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} from residents</Text>
            </View>
          </View>
          <PropertyReviewsSection reviews={reviews.slice(0, PREVIEW_COUNT)} />
        </>
      ) : (
        <Text style={styles.empty}>No reviews yet.</Text>
      )}
      {canWrite ? (
        <Pressable accessibilityRole="button" style={styles.write} onPress={() => setSheetOpen(true)}>
          <Ionicons name="create-outline" size={18} color={DesignColors.primaryFixed} />
          <Text style={styles.writeText}>Write a review</Text>
        </Pressable>
      ) : null}
      {isPaid && eligibility && !eligibility.canReview ? (
        <Text style={styles.empty}>You have used all 3 of your reviews for this place.</Text>
      ) : null}
      <WriteReviewSheet visible={sheetOpen} listingId={listingId} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: DesignSpacing.sm, marginBottom: DesignSpacing.lg },
  link: { fontFamily, fontSize: 13, fontWeight: '700', color: DesignColors.primaryFixed },
  summary: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, marginBottom: DesignSpacing.xs },
  average: { fontFamily, fontSize: 30, fontWeight: '800', color: DesignColors.onSurface },
  summaryText: { gap: 2 },
  stars: { flexDirection: 'row', gap: 2 },
  count: { fontFamily, fontSize: 12, color: DesignColors.outline },
  empty: { fontFamily, fontSize: 14, color: DesignColors.onSurfaceVariant },
  write: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: DesignRadius.full,
    borderWidth: 1.5,
    borderColor: DesignColors.primaryBright,
  },
  writeText: { fontFamily, fontSize: 14, fontWeight: '700', color: DesignColors.primaryFixed },
  errorCard: { gap: DesignSpacing.sm, padding: DesignSpacing.md, marginBottom: DesignSpacing.lg, borderRadius: DesignRadius.md, backgroundColor: DesignColors.surfaceContainerLow },
  errorTitle: { fontFamily, fontSize: 14, fontWeight: '700', color: DesignColors.onSurface },
  errorText: { fontFamily, fontSize: 14, color: DesignColors.onSurfaceVariant },
  retry: { alignSelf: 'flex-start', paddingHorizontal: DesignSpacing.md, paddingVertical: DesignSpacing.sm, borderRadius: DesignRadius.sm, backgroundColor: DesignColors.primary },
  retryText: { fontFamily, fontSize: 14, fontWeight: '700', color: DesignColors.onPrimary },
});
