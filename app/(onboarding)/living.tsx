import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

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

export default function OnboardingLivingScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data, updateData } = useOnboarding();

  const handleContinue = () => {
    if (!data.maxBudget || !data.preferredArea.trim()) {
      showToast({ type: 'error', message: 'Please enter a budget and preferred area.' });
      return;
    }
    router.push('/(onboarding)/verification');
  };

  return (
    <OnboardingLayout>
      <OnboardingProgress step={3} label="Living Preferences" />

      <OnboardingGlassCard>
        <View style={styles.header}>
          <Text style={styles.title}>Living preferences</Text>
          <Text style={styles.subtitle}>Set your budget and preferred area to find the best options.</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Monthly budget (₦)</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="cash-outline" size={22} color={DesignColors.primary} style={styles.inputIcon} />
            <TextInput
              placeholder="e.g. 50000"
              placeholderTextColor={DesignColors.textSecondary}
              value={data.maxBudget}
              onChangeText={(value) => updateData({ maxBudget: value.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Preferred area</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="location-outline" size={22} color={DesignColors.primary} style={styles.inputIcon} />
            <TextInput
              placeholder="e.g. Gidan Kwano, Bosso"
              placeholderTextColor={DesignColors.textSecondary}
              value={data.preferredArea}
              onChangeText={(value) => updateData({ preferredArea: value })}
              style={styles.input}
            />
          </View>
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
  fieldGroup: {
    gap: DesignSpacing.sm,
  },
  label: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    paddingHorizontal: 4,
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
});
