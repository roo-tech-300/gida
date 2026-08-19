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
  const [customMin, setCustomMin] = useState('');
  const [customMax, setCustomMax] = useState('');

  const handleMinPreset = (value: number) => {
    setCustomMin('');
    updateData({ minBudget: String(value) });
  };

  const handleMaxPreset = (value: number) => {
    setCustomMax('');
    updateData({ maxBudget: String(value) });
  };

  const handleCustomMin = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setCustomMin(digits);
    updateData({ minBudget: digits });
  };

  const handleCustomMax = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setCustomMax(digits);
    updateData({ maxBudget: digits });
  };

  const formatBudget = (value: string) =>
    value ? Number(value).toLocaleString('en-US') : '';

  const handleContinue = () => {
    const min = Number(data.minBudget);
    const max = Number(data.maxBudget);

    if (!data.minBudget || min < 100000) {
      showToast({ type: 'error', message: 'Minimum budget must be at least ₦100,000.' });
      return;
    }
    if (!data.maxBudget || max < 100000) {
      showToast({ type: 'error', message: 'Maximum budget must be at least ₦100,000.' });
      return;
    }
    if (min > max) {
      showToast({ type: 'error', message: 'Minimum budget cannot exceed maximum.' });
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

        <Text style={styles.fieldLabel}>Minimum budget</Text>
        <View style={styles.chipRow}>
          {BUDGET_PRESETS.map((preset) => (
            <OnboardingChip
              key={`min-${preset.value}`}
              label={preset.label}
              selected={data.minBudget === String(preset.value)}
              onPress={() => handleMinPreset(preset.value)}
            />
          ))}
        </View>

        <View style={styles.inputWrap}>
          <Ionicons name="cash-outline" size={20} color={DesignColors.onSurfaceVariant} style={styles.inputIcon} />
          <Text style={styles.currency}>₦</Text>
          <TextInput
            placeholder="Enter minimum"
            placeholderTextColor={DesignColors.textSecondary}
            value={formatBudget(customMin)}
            onChangeText={handleCustomMin}
            keyboardType="numeric"
            style={styles.textInput}
          />
        </View>

        <Text style={[styles.fieldLabel, { marginTop: DesignSpacing.md }]}>Maximum budget</Text>
        <View style={styles.chipRow}>
          {BUDGET_PRESETS.map((preset) => (
            <OnboardingChip
              key={`max-${preset.value}`}
              label={preset.label}
              selected={data.maxBudget === String(preset.value)}
              onPress={() => handleMaxPreset(preset.value)}
            />
          ))}
        </View>

        <View style={styles.inputWrap}>
          <Ionicons name="cash-outline" size={20} color={DesignColors.onSurfaceVariant} style={styles.inputIcon} />
          <Text style={styles.currency}>₦</Text>
          <TextInput
            placeholder="Enter maximum"
            placeholderTextColor={DesignColors.textSecondary}
            value={formatBudget(customMax)}
            onChangeText={handleCustomMax}
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
  fieldLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginTop: DesignSpacing.sm,
    marginBottom: DesignSpacing.xs,
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
    marginTop: DesignSpacing.sm,
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
