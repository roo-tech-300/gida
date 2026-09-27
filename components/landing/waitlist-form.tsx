import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useJoinWaitlist } from '@/hooks/use-join-waitlist';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FALLBACK_ERROR_MESSAGE = 'Failed to join the waitlist. Please try again.';

type WaitlistFormProps = {
  onJoined: (alreadyJoined: boolean) => void;
};

export function WaitlistForm({ onJoined }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const { showToast } = useAppToast();
  const { mutate, isPending } = useJoinWaitlist();

  const handleSubmit = () => {
    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setValidationError('Enter a valid email address.');
      return;
    }
    setValidationError(undefined);
    setSubmitError(undefined);

    mutate(
      { email: trimmedEmail },
      {
        onSuccess: ({ alreadyJoined }) => onJoined(alreadyJoined),
        onError: (error) => {
          // Shown both inline and as a toast: a toast alone can be missed
          // or auto-dismiss before someone notices, and this form has no
          // other way to signal that the email genuinely wasn't saved.
          const message = error instanceof Error ? error.message : FALLBACK_ERROR_MESSAGE;
          console.error('[WaitlistForm] Failed to join waitlist:', error);
          setSubmitError(message);
          showToast({ message, type: 'error' });
        },
      },
    );
  };

  return (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.container}>
      <AuthInput
        label="Email address"
        placeholder="you@example.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (validationError) setValidationError(undefined);
          if (submitError) setSubmitError(undefined);
        }}
        error={validationError}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      {submitError ? (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={DesignColors.error} />
          <Text style={styles.errorText}>{submitError}</Text>
        </Animated.View>
      ) : null}

      <View style={styles.submitSpacer}>
        <AuthButton label="Join the waitlist" onPress={handleSubmit} isLoading={isPending} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  submitSpacer: {
    marginTop: DesignSpacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    marginTop: DesignSpacing.sm,
    padding: DesignSpacing.sm,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.dangerContainer,
  },
  errorText: {
    ...DesignTypography.labelSm,
    color: DesignColors.error,
    fontFamily,
    flex: 1,
  },
});
