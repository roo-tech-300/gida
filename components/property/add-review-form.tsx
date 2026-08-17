import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useCreateReview } from '@/hooks/use-create-review';
import { useAppToast } from '@/components/ui/toast-card';

type Props = {
  listingId: string;
  onSuccess?: () => void;
};

export function AddReviewForm({ listingId, onSuccess }: Props) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const { mutateAsync: createReview, isPending } = useCreateReview(listingId);
  const { showToast } = useAppToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast({ message: 'Please select a rating', type: 'error' });
      return;
    }

    if (!text.trim()) {
      showToast({ message: 'Please write a review', type: 'error' });
      return;
    }

    try {
      await createReview({
        listing_id: listingId,
        rating,
        text: text.trim(),
      });

      showToast({ message: 'Review posted successfully!', type: 'success' });
      setRating(0);
      setText('');
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to post review';
      showToast({ message, type: 'error' });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Your Experience</Text>

      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>Rate this property</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              onPress={() => setRating(star)}
              style={({ pressed }) => [styles.star, pressed && styles.starPressed]}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={32}
                color={star <= rating ? DesignColors.rating : DesignColors.onSurfaceVariant}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.textContainer}>
        <TextInput
          style={styles.input}
          placeholder="Share your thoughts about this property..."
          placeholderTextColor={DesignColors.onSurfaceVariant}
          multiline
          numberOfLines={4}
          value={text}
          onChangeText={setText}
          editable={!isPending}
          maxLength={500}
        />
        <Text style={styles.charCount}>{text.length}/500</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed, isPending && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color={DesignColors.onPrimary} />
        ) : (
          <>
            <Ionicons name="checkmark" size={18} color={DesignColors.onPrimary} />
            <Text style={styles.submitText}>Post Review</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.lg,
    gap: DesignSpacing.lg,
    marginBottom: DesignSpacing.lg,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  ratingContainer: {
    gap: DesignSpacing.sm,
  },
  ratingLabel: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  stars: {
    flexDirection: 'row',
    gap: DesignSpacing.md,
  },
  star: {
    padding: 4,
  },
  starPressed: {
    opacity: 0.7,
  },
  textContainer: {
    gap: DesignSpacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    borderRadius: DesignRadius.sm,
    padding: DesignSpacing.md,
    minHeight: 100,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    textAlignVertical: 'top',
  },
  charCount: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: DesignColors.primary,
    borderRadius: DesignRadius.sm,
    paddingVertical: DesignSpacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    ...DesignTypography.labelLg,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '600',
  },
});
