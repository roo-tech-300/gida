import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/onboarding-continue-button';
import { OnboardingGlassCard } from '@/components/onboarding/onboarding-glass-card';
import { OnboardingLayout } from '@/components/onboarding/onboarding-layout';
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
import { SUGGESTED_CITIES } from '@/types/onboarding';

export default function OnboardingCityScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data, updateData } = useOnboarding();
  const [city, setCity] = useState(data.city);

  const handleContinue = () => {
    if (!city.trim()) {
      showToast({ type: 'error', message: 'Please enter or select a city.' });
      return;
    }
    updateData({ city: city.trim() });
    router.push('/(onboarding)/roommate');
  };

  return (
    <OnboardingLayout
      footer={
        <Text style={styles.footer}>
          You can change your location preferences later in settings.
        </Text>
      }>
      <OnboardingProgress step={1} />

      <OnboardingGlassCard>
        <View style={styles.header}>
          <Text style={styles.title}>Let&apos;s set up your profile</Text>
          <Text style={styles.subtitle}>Where are you looking for a home?</Text>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.inputWrap}>
            <Ionicons name="location" size={22} color={DesignColors.primary} style={styles.inputIcon} />
            <TextInput
              placeholder="Enter city..."
              placeholderTextColor={DesignColors.textSecondary}
              value={city}
              onChangeText={setCity}
              style={styles.input}
            />
          </View>

          <View style={styles.chips}>
            {SUGGESTED_CITIES.map((suggested) => (
              <Pressable
                key={suggested}
                accessibilityRole="button"
                onPress={() => setCity(suggested)}
                style={({ pressed }) => [
                  styles.chip,
                  city === suggested && styles.chipActive,
                  pressed && styles.chipPressed,
                ]}>
                <Text style={[styles.chipLabel, city === suggested && styles.chipLabelActive]}>
                  {suggested}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <OnboardingContinueButton onPress={handleContinue} />
      </OnboardingGlassCard>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: DesignSpacing.xs,
  },
  title: {
    ...DesignTypography.headlineLg,
    color: DesignColors.onSurface,
    fontFamily,
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  fieldGroup: {
    gap: DesignSpacing.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: DesignRadius.lg,
    backgroundColor: 'rgba(32, 31, 33, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: DesignSpacing.md,
  },
  inputIcon: {
    marginRight: DesignSpacing.sm,
  },
  input: {
    flex: 1,
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    paddingVertical: 0,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  chip: {
    paddingHorizontal: DesignSpacing.lg,
    paddingVertical: DesignSpacing.sm,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  chipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: DesignColors.primary,
  },
  chipPressed: {
    opacity: 0.9,
  },
  chipLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  chipLabelActive: {
    color: DesignColors.primaryBright,
  },
  footer: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    opacity: 0.4,
    marginTop: DesignSpacing.lg,
    paddingHorizontal: DesignSpacing.xl,
    lineHeight: 18,
  },
});
