import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useListing } from '@/hooks/use-listing';
import { useReviews, useReviewSummary } from '@/hooks/use-reviews';
import { useReviewEligibility } from '@/hooks/use-review-eligibility';
import { PropertyReviewsSection } from './property-reviews-section';
import { AddReviewForm } from './add-review-form';

type Props = {
  listingId: string;
};

export function PropertyReviewsScreen({ listingId }: Props) {
  const { data, isLoading, isError } = useListing(listingId);
  const { data: reviews = [], isLoading: isLoadingReviews, isError: isReviewsError, error: reviewsError, refetch: refetchReviews } = useReviews(listingId);
  const { data: summary, isError: isSummaryError, error: summaryError, refetch: refetchSummary } = useReviewSummary(listingId);
  const { data: eligibility } = useReviewEligibility(listingId);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={DesignColors.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Could not load reviews</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="chevron-back" size={20} color={DesignColors.onSurface} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.heading}>{data.listing.title}</Text>
        <Text style={styles.subheading}>{data.listing.location}</Text>

        {isReviewsError || isSummaryError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load reviews</Text>
            <Text style={styles.errorText}>
              {reviewsError instanceof Error
                ? reviewsError.message
                : summaryError instanceof Error
                  ? summaryError.message
                  : 'Something went wrong while loading the review data.'}
            </Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                void refetchReviews();
                void refetchSummary();
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Average rating</Text>
            <Text style={styles.summaryValue}>{summary?.averageRating.toFixed(1) ?? '0.0'}</Text>
            <Text style={styles.summaryMeta}>{reviews.length} review{reviews.length === 1 ? '' : 's'}</Text>
          </View>
        )}

        {eligibility?.canReview ? <AddReviewForm listingId={listingId} /> : null}
        {!eligibility?.canReview && eligibility?.paid ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>You have used all 3 review slots.</Text>
          </View>
        ) : null}

        {!isLoadingReviews && !isReviewsError ? <PropertyReviewsSection reviews={reviews} avgRating={summary?.averageRating ?? 0} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surface },
  content: { padding: DesignSpacing.marginMobile, gap: DesignSpacing.lg, paddingBottom: 120 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.md, backgroundColor: DesignColors.surface },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily },
  backButton: { paddingHorizontal: DesignSpacing.lg, paddingVertical: DesignSpacing.md, backgroundColor: DesignColors.primary, borderRadius: DesignRadius.md },
  backButtonText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimary, fontFamily, fontWeight: '700' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  heading: { ...DesignTypography.headlineLg, color: DesignColors.onSurface, fontFamily, fontWeight: '800' },
  subheading: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  summaryCard: { backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.cardBorder, borderRadius: DesignRadius.md, padding: DesignSpacing.lg, gap: 4 },
  summaryLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, textTransform: 'uppercase', letterSpacing: 1.2 },
  summaryValue: { fontSize: 40, lineHeight: 44, color: DesignColors.primaryBright, fontFamily, fontWeight: '800' },
  summaryMeta: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  notice: { padding: DesignSpacing.md, borderRadius: DesignRadius.md, backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.cardBorder },
  noticeTitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  errorCard: {
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    gap: DesignSpacing.sm,
  },
  errorTitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  errorText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 22 },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    borderRadius: DesignRadius.sm,
    backgroundColor: DesignColors.primary,
  },
  retryText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimary, fontFamily, fontWeight: '700' },
});
