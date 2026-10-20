import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors } from '@/constants/design';
import { OnboardingLayout } from '@/components/onboarding/onboarding-layout';

/**
 * Shared shell for every personal-information page.
 *
 * Each field is its own route, so every page gets its own back button and
 * its own card (the field card for the three editable fields, the locked
 * card for the email). The actual input/save UI lives in
 * PersonalInfoFieldCard.
 */
type PersonalInfoFieldScreenCoreProps = {
  value: string;
  error?: string;
  saving?: boolean;
  canSave: boolean;
  onChange: (text: string) => void;
  onSave: () => void;
  children: ReactNode;
};

export function PersonalInfoFieldScreenCore({
  value,
  error,
  saving = false,
  canSave,
  onChange,
  onSave,
  children,
}: PersonalInfoFieldScreenCoreProps) {
  const router = useRouter();

  return (
    <OnboardingLayout
      header={
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={router.back}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}>
          <Ionicons name="arrow-back" size={22} color={DesignColors.onSurface} />
        </Pressable>
      }>
      <>{children}</>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    margin: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.surface,
    borderRadius: 20,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
});
