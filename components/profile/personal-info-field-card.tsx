import { StyleSheet, Text, View } from 'react-native';

import { AuthInput } from '@/components/auth/auth-input';
import { OnboardingContinueButton } from '@/components/onboarding/onboarding-continue-button';
import { OnboardingGlassCard } from '@/components/onboarding/onboarding-glass-card';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { PersonalInfoFieldConfig } from './personal-info-fields';

type PersonalInfoFieldCardProps = {
  field: PersonalInfoFieldConfig;
  value: string;
  error?: string;
  saving?: boolean;
  canSave: boolean;
  onChange: (text: string) => void;
  onSave: () => void;
};

export function PersonalInfoFieldCard({
  field,
  value,
  error,
  saving,
  canSave,
  onChange,
  onSave,
}: PersonalInfoFieldCardProps) {
  return (
    <OnboardingGlassCard showGlow={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{field.title}</Text>
        <Text style={styles.subtitle}>{field.subtitle}</Text>
      </View>
      <AuthInput
        label={field.label}
        value={value}
        error={error}
        placeholder={field.label}
        prefix={field.id === 'username' ? '@' : undefined}
        onChangeText={onChange}
        returnKeyType="done"
        {...field.inputProps}
      />
      <Text style={styles.helper}>{field.helper}</Text>
      <OnboardingContinueButton
        label="Save"
        showArrow={false}
        labelColor="#FFFFFF"
        onPress={onSave}
        disabled={!canSave}
        isLoading={saving}
      />
    </OnboardingGlassCard>
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
    textAlign: 'center',
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    lineHeight: 22,
  },
  helper: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    opacity: 0.85,
    textAlign: 'center',
  },
});