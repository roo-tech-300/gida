import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { Review } from '@/types/reviews';

type Props = {
  reviews: Review[];
  avgRating: number;
};

export function PropertyReviewsSection({ reviews, avgRating }: Props) {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color={DesignColors.rating} />
          <Text style={styles.ratingText}>{avgRating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({reviews.length})</Text>
        </View>
      </View>
      {reviews.map((review) => (
        <View key={review.id} style={styles.card}>
          <View style={styles.reviewTop}>
            <View style={styles.authorRow}>
              {!review.anonymous && review.avatar ? <Image source={{ uri: review.avatar }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>A</Text></View>}
              <View>
                <Text style={styles.author}>{review.anonymous ? 'Anonymous' : review.author || 'Anonymous'}</Text>
                <Text style={styles.date}>{new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              </View>
            </View>
            <View style={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < review.rating ? 'star' : 'star-outline'}
                size={12}
                color={i < review.rating ? DesignColors.rating : DesignColors.onSurfaceVariant}
              />
            ))}
          </View>
        </View>
          <View style={styles.metaRow}>
            <Text style={styles.verified}>Verified Paid Slot</Text>
            {review.review_number > 1 ? <Text style={styles.counter}>Review #{review.review_number}</Text> : null}
          </View>
          <Text style={styles.text}>{review.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: DesignSpacing.xl,
    gap: DesignSpacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    marginBottom: DesignSpacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  reviewCount: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.sm,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.md,
    gap: DesignSpacing.sm,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerHighest,
  },
  avatarFallbackText: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    fontWeight: '700',
  },
  author: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  date: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  text: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
    alignItems: 'center',
  },
  verified: {
    ...DesignTypography.labelSm,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '700',
  },
  counter: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
