import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignSpacing } from '@/constants/design';
import { useJoinWaitlist } from '@/hooks/use-join-waitlist';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistFormProps = {
  onJoined: (alreadyJoined: boolean) => void;
};

export function WaitlistForm({ onJoined }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>();
  const { showToast } = useAppToast();
  const { mutate, isPending } = useJoinWaitlist();

  const handleSubmit = () => {
    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setValidationError('Enter a valid email address.');
      return;
    }
    setValidationError(undefined);

    mutate(
      { email: trimmedEmail },
      {
        onSuccess: ({ alreadyJoined }) => onJoined(alreadyJoined),
        onError: (error) => {
          showToast({ message: error instanceof Error ? error.message : 'Failed to join the waitlist.', type: 'error' });
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
        }}
        error={validationError}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
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
});
