import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputContentSizeChangeEvent } from 'react-native';

import { DesignColors, fontFamily } from '@/constants/design';
import type { NewPlaceReview } from '@/types/place';
import { validatePlaceReview, type ReviewValidationError } from '@/utils/validate-place-review';

const STARS = [1, 2, 3, 4, 5];
const MIN_INPUT_HEIGHT = 44;
const MAX_INPUT_HEIGHT = 100;

type Props = {
  onSubmit: (review: NewPlaceReview) => Promise<boolean>;
};

export function PlaceReviewForm({ onSubmit }: Props) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ReviewValidationError>(null);

  const remaining = 280 - text.trim().length;

  const onContentSizeChange = useCallback(
    (e: TextInputContentSizeChangeEvent) => {
      const { height } = e.nativeEvent.contentSize;
      const nextHeight = Math.min(Math.max(height, MIN_INPUT_HEIGHT), MAX_INPUT_HEIGHT);
      setInputHeight(nextHeight);
    },
    [],
  );

  const selectRating = (value: number) => {
    setRating(value);
    if (error?.field === 'rating') setError(null);
  };

  const changeText = (value: string) => {
    setText(value);
    if (error?.field === 'text') setError(null);
  };

  const submitReview = async () => {
    if (isSubmitting) return;

    const validationError = validatePlaceReview(rating, text);
    setError(validationError);
    if (validationError) return;

    setIsSubmitting(true);
    try {
      const saved = await onSubmit({ rating, text: text.trim() });
      if (saved) {
        setText('');
        setRating(0);
        setInputHeight(MIN_INPUT_HEIGHT);
      }
    } catch (error) {
      console.error('[PlaceReviewForm] Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.stars}>
        {STARS.map((value) => (
          <Pressable
            key={value}
            accessibilityLabel={`${value} star`}
            accessibilityRole="button"
            accessibilityState={{ selected: value <= rating }}
            onPress={() => selectRating(value)}
            style={[styles.star, value <= rating && styles.starActive]}
          >
            <Ionicons
              color={value <= rating ? DesignColors.rating : DesignColors.onSurfaceVariant}
              name="star"
              size={20}
            />
          </Pressable>
        ))}
      </View>

      {error?.field === 'rating' ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error.message}
        </Text>
      ) : null}

      <View style={[styles.inputWrap, error?.field === 'text' && styles.inputWrapError]}>
        <TextInput
          maxLength={280}
          multiline
          numberOfLines={1}
          onChangeText={changeText}
          onContentSizeChange={onContentSizeChange}
          placeholder="Write a review..."
          placeholderTextColor={DesignColors.textSecondary}
          style={[styles.input, { height: inputHeight }]}
          underlineColorAndroid="transparent"
          value={text}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send review"
          accessibilityState={{ disabled: isSubmitting }}
          disabled={isSubmitting}
          onPress={() => void submitReview()}
          style={[styles.sendButton, isSubmitting && styles.sendButtonDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons color="#FFFFFF" name="arrow-forward" size={20} />
          )}
        </Pressable>
      </View>

      {error?.field === 'text' ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error.message}
        </Text>
      ) : null}

      <Text style={styles.counter}>{remaining} / 280</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
  },
  star: {
    padding: 4,
  },
  starActive: {
    transform: [{ scale: 1.1 }],
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 11,
    lineHeight: 14,
    color: DesignColors.textSecondary,
    fontFamily,
    marginTop: 4,
  },
  error: {
    fontSize: 12,
    lineHeight: 16,
    color: DesignColors.error,
    fontFamily,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    borderRadius: 16,
    backgroundColor: DesignColors.surfaceContainerLowest,
    overflow: 'hidden',
  },
  inputWrapError: {
    borderColor: DesignColors.error,
  },
  input: {
    flex: 1,
    minHeight: MIN_INPUT_HEIGHT,
    height: MIN_INPUT_HEIGHT,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: DesignColors.textPrimary,
    fontFamily,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primary,
    margin: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
