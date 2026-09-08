import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { OnboardingGlassCard } from '@/components/onboarding/onboarding-glass-card';
import { OnboardingLayout } from '@/components/onboarding/onboarding-layout';
import { OnboardingNavRow } from '@/components/onboarding/onboarding-nav-row';
import { OnboardingOptionCard } from '@/components/onboarding/onboarding-option-card';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { useAppToast } from '@/components/ui/toast-card';
import {
  DesignColors,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';
import { useOnboarding } from '@/context/onboarding-context';
import { GENDER_OPTIONS } from '@/types/onboarding';

export default function OnboardingGenderScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data, updateData } = useOnboarding();

  const handleContinue = () => {
    if (!data.gender) {
      showToast({ type: 'error', message: 'Please select your gender to continue.' });
      return;
    }
    router.push('/(onboarding)/preferences-budget');
  };

  return (
    <OnboardingLayout>
      <OnboardingProgress step={2} label="About You" />

      <OnboardingGlassCard>
        <View style={styles.header}>
          <Text style={styles.title}>What&apos;s your gender?</Text>
          <Text style={styles.subtitle}>
            Gida uses your gender to match you with compatible roommates and keep groups single-gender.
          </Text>
        </View>

        <View style={styles.options}>
          {GENDER_OPTIONS.map((option) => (
            <OnboardingOptionCard
              key={option.id}
              title={option.label}
              description={option.description}
              icon={option.icon as keyof typeof Ionicons.glyphMap}
              selected={data.gender === option.id}
              onPress={() => updateData({ gender: option.id })}
            />
          ))}
        </View>
      </OnboardingGlassCard>

      <OnboardingNavRow showBack={false} continueDisabled={!data.gender} onContinue={handleContinue} />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: DesignSpacing.xs,
    alignItems: 'center',
  },
  title: {
    ...DesignTypography.headlineLg,
    color: DesignColors.onSurface,
    fontFamily,
    textAlign: 'center',
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    lineHeight: 20,
  },
  options: {
    gap: DesignSpacing.md,
    marginTop: DesignSpacing.xs,
  },
});
