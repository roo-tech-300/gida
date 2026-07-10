import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { OnboardingGlassCard } from '@/components/onboarding/onboarding-glass-card';
import { OnboardingLayout } from '@/components/onboarding/onboarding-layout';
import { OnboardingNavRow } from '@/components/onboarding/onboarding-nav-row';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { useAppToast } from '@/components/ui/toast-card';
import {
  DesignColors,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';
import { useOnboarding } from '@/context/onboarding-context';
import { SLEEP_SCHEDULE_OPTIONS } from '@/types/onboarding';

export default function OnboardingRoommateScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data, updateData } = useOnboarding();

  const handleContinue = () => {
    if (!data.sleepSchedule) {
      showToast({ type: 'error', message: 'Please select a sleep schedule.' });
      return;
    }
    router.push('/(onboarding)/living');
  };

  return (
    <OnboardingLayout>
      <OnboardingProgress step={2} label="Roommate Preferences" />

      <OnboardingGlassCard>
        <View style={styles.header}>
          <Text style={styles.title}>Roommate preferences</Text>
          <Text style={styles.subtitle}>Help us match you with compatible roommates.</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleLabel}>Smoking allowed</Text>
            <Text style={styles.toggleHint}>
              {data.smokerAllowed ? 'You&apos;re okay with smoking' : 'Non-smoking only'}
            </Text>
          </View>
          <Switch
            value={data.smokerAllowed}
            onValueChange={(value) => updateData({ smokerAllowed: value })}
            trackColor={{ false: DesignColors.surfaceContainerHighest, true: DesignColors.primary }}
            thumbColor="#ffffff"
          />
        </View>

        <Text style={styles.sectionLabel}>Sleep schedule</Text>

        <View style={styles.options}>
          {SLEEP_SCHEDULE_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              onPress={() => updateData({ sleepSchedule: option.id })}
              style={({ pressed }) => [
                styles.option,
                data.sleepSchedule === option.id && styles.optionActive,
                pressed && styles.optionPressed,
              ]}>
              <View style={styles.radio}>
                {data.sleepSchedule === option.id ? <View style={styles.radioFill} /> : null}
              </View>
              <View style={styles.optionCopy}>
                <Text
                  style={[
                    styles.optionTitle,
                    data.sleepSchedule === option.id && styles.optionTitleActive,
                  ]}>
                  {option.label}
                </Text>
                <Text style={styles.optionDesc}>{option.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </OnboardingGlassCard>

      <OnboardingNavRow onBack={() => router.back()} onContinue={handleContinue} />
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DesignSpacing.lg,
    borderRadius: 20,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleCopy: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  toggleHint: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    opacity: 0.7,
  },
  sectionLabel: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    paddingHorizontal: 4,
  },
  options: {
    gap: DesignSpacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderColor: DesignColors.primary,
  },
  optionPressed: {
    opacity: 0.9,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: DesignColors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: DesignColors.primary,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    ...DesignTypography.bodyLg,
    fontWeight: '600',
    color: DesignColors.onSurface,
    fontFamily,
  },
  optionTitleActive: {
    color: DesignColors.primaryBright,
  },
  optionDesc: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    opacity: 0.8,
  },
});
