import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import type { AddPlaceStep } from '@/hooks/use-add-place-form';

type Props = {
  step: AddPlaceStep;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

export function AddPlaceActions({ step, isSubmitting, onBack, onNext, onSubmit }: Props) {
  const isFinal = step === 5;
  const isFirst = step === 1;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isFirst ? 'Cancel and go back' : 'Go back to previous step'}
        disabled={isSubmitting}
        onPress={onBack}
        style={[styles.button, styles.backButton]}
      >
        <Ionicons name="arrow-back" size={18} color={DesignColors.textSecondary} />
        <Text style={styles.backText}>{isFirst ? 'Cancel' : 'Back'}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isFinal ? 'Publish place' : 'Continue to next step'}
        disabled={isSubmitting}
        onPress={isFinal ? onSubmit : onNext}
        style={[styles.button, styles.nextButton, isFinal && styles.submitButton]}
      >
        {isSubmitting ? (
          <ActivityIndicator color={DesignColors.onPrimary} size="small" />
        ) : (
          <>
            <Text style={styles.nextText}>{isFinal ? 'Publish Place' : 'Continue'}</Text>
            <Ionicons
              name={isFinal ? 'checkmark' : 'arrow-forward'}
              size={18}
              color={DesignColors.onPrimary}
            />
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: DesignSpacing.md,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.md,
    borderTopWidth: 1,
    borderTopColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: DesignRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.xs,
  },
  backButton: {
    backgroundColor: DesignColors.surfaceContainer,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignColors.textSecondary,
    fontFamily,
  },
  nextButton: {
    backgroundColor: DesignColors.primaryContainer,
  },
  submitButton: {
    backgroundColor: DesignColors.primary,
  },
  nextText: {
    fontSize: 14,
    fontWeight: '700',
    color: DesignColors.onPrimary,
    fontFamily,
  },
});
