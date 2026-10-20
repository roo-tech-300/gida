import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { DesignColors } from '@/constants/design';
import { OnboardingLayout } from '@/components/onboarding/onboarding-layout';
import { RoommateMoreForm } from '@/components/roommate/roommate-more-form';

/**
 * More roommate settings route.
 *
 * One page for the roommate_preferences fields that are not shown on the
 * main profile rows (sleep_schedule, cleanliness_level, guest_policy,
 * study_habitat, personality_vibe, smoker_allowed, religion_preference).
 */
export default function RoommateMoreSettingsScreen() {
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
      <RoommateMoreForm />
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
