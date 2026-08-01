import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { OnboardingChip } from '@/components/onboarding/onboarding-chip';
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
import { BUDGET_PRESETS, FUT_MINNA_AREAS } from '@/types/onboarding';

export default function OnboardingBudgetScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data, updateData } = useOnboarding();
  const [customBudget, setCustomBudget] = useState('');

  const handleBudgetPreset = (value: number) => {
    setCustomBudget('');
    updateData({ maxBudget: String(value) });
  };

  const handleCustomBudget = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setCustomBudget(digits);
    updateData({ maxBudget: digits });
  };

  const formattedBudget = data.maxBudget
    ? Number(data.maxBudget).toLocaleString('en-US')
    : '';

  const handleContinue = () => {
    if (!data.maxBudget || Number(data.maxBudget) < 100000) {
      showToast({ type: 'error', message: 'Please select or enter a budget (min ₦100,000).' });
      return;
    }
    if (!data.preferredArea) {
      showToast({ type: 'error', message: 'Please select a preferred area.' });
      return;
    }
    router.push('/(onboarding)/preferences-layout');
  };

  return (
    <OnboardingLayout>
      <OnboardingProgress step={1} label="Budget & Area" />

      <OnboardingGlassCard>
        <View style={styles.header}>
          <Text style={styles.title}>Set your budget</Text>
          <Text style={styles.subtitle}>Choose a yearly budget range for your search.</Text>
        </View>

        <View style={styles.chipRow}>
          {BUDGET_PRESETS.map((preset) => (
            <OnboardingChip
              key={preset.value}
              label={preset.label}
              selected={data.maxBudget === String(preset.value)}
              onPress={() => handleBudgetPreset(preset.value)}
            />
          ))}
        </View>

        <View style={styles.inputWrap}>
          <Ionicons name="cash-outline" size={20} color={DesignColors.onSurfaceVariant} style={styles.inputIcon} />
          <Text style={styles.currency}>₦</Text>
          <TextInput
            placeholder="Enter amount"
            placeholderTextColor={DesignColors.textSecondary}
            value={formattedBudget}
            onChangeText={handleCustomBudget}
            keyboardType="numeric"
            style={styles.textInput}
          />
        </View>
      </OnboardingGlassCard>

      <OnboardingGlassCard>
        <View style={styles.header}>
          <Text style={styles.title}>Preferred area</Text>
          <Text style={styles.subtitle}>Where do you want to live near FUT Minna?</Text>
        </View>

        <View style={styles.chipRow}>
          {FUT_MINNA_AREAS.map((area) => (
            <OnboardingChip
              key={area}
              label={area}
              selected={data.preferredArea === area}
              onPress={() => updateData({ preferredArea: area })}
            />
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
    justifyContent: 'center',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    paddingHorizontal: DesignSpacing.md,
  },
  inputIcon: {
    marginRight: DesignSpacing.xs,
  },
  currency: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginRight: DesignSpacing.xs,
  },
  textInput: {
    flex: 1,
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    paddingVertical: 0,
  },
});
