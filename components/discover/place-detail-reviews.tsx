import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StarRating } from '@/components/ui/star-rating';
import { DesignColors, fontFamily } from '@/constants/design';
import type { PlaceReview } from '@/types/place';

type Props = {
  reviews: PlaceReview[];
  rating: number;
  ratingCount: number;
  onRate: () => void;
};

export function PlaceDetailReviews({ reviews, rating, ratingCount, onRate }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reviews</Text>
        <Pressable accessibilityRole="button" onPress={onRate} style={styles.rateButton}>
          <Text style={styles.rateLabel}>Rate this place</Text>
        </Pressable>
      </View>
      <StarRating count={ratingCount} rating={rating} showValue />

      {reviews.length === 0 ? (
        <Text style={styles.empty}>No reviews yet. Be the first to rate this place.</Text>
      ) : (
        reviews.map((review) => (
          <View key={review.id} style={styles.review}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{review.initials}</Text>
            </View>
            <View style={styles.reviewBody}>
              <View style={styles.reviewTop}>
                <Text style={styles.author}>{review.author}</Text>
                <Text style={styles.when}>{review.createdAt}</Text>
              </View>
              <StarRating rating={review.rating} size={12} />
              <Text style={styles.text}>{review.text}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: DesignColors.textPrimary,
    fontFamily,
  },
  rateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: DesignColors.primaryTint,
  },
  rateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignColors.primaryFixed,
    fontFamily,
  },
  empty: {
    fontSize: 13,
    lineHeight: 20,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  review: {
    flexDirection: 'row',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  initials: {
    fontSize: 11,
    fontWeight: '700',
    color: DesignColors.primaryFixed,
    fontFamily,
  },
  reviewBody: {
    flex: 1,
    gap: 4,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  author: {
    fontSize: 13,
    fontWeight: '600',
    color: DesignColors.textPrimary,
    fontFamily,
  },
  when: {
    fontSize: 11,
    color: DesignColors.textSecondary,
    fontFamily,
  },
  text: {
    fontSize: 13,
    lineHeight: 20,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
