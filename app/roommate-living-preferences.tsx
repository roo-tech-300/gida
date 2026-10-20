import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { DesignColors } from '@/constants/design';
import { OnboardingLayout } from '@/components/onboarding/onboarding-layout';
import { LivingPreferencesForm } from '@/components/roommate/living-preferences-form';

/**
 * Living Preferences editor route.
 *
 * One page containing every field in the living_preferences table
 * (max_budget, preferred_area, preferred_layout, min_bedrooms, min_budget). Actual input/save logic lives in
 * LivingPreferencesForm so this route stays a thin shell.
 */
export default function RoommateLivingPreferencesScreen() {
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
      <LivingPreferencesForm />
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
