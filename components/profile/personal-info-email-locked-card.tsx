import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingGlassCard } from '@/components/onboarding/onboarding-glass-card';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { EMAIL_LOCK_MESSAGE } from './personal-info-fields';

export function PersonalInfoEmailLockedCard({ email }: { email: string }) {
  return (
    <OnboardingGlassCard showGlow={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Email address</Text>
        <Text style={styles.subtitle}>Where we send account notices and reservation updates.</Text>
      </View>
      <View style={styles.lockRow}>
        <Ionicons name="lock-closed-outline" size={18} color={DesignColors.onSurfaceVariant} />
        <Text style={styles.email}>{email}</Text>
      </View>
      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={18} color={DesignColors.onSurfaceVariant} />
        <Text style={styles.noticeText}>{EMAIL_LOCK_MESSAGE}</Text>
      </View>
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
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    minHeight: 56,
    paddingHorizontal: DesignSpacing.md,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    opacity: 0.7,
  },
  email: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.sm,
  },
  noticeText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
    lineHeight: 18,
  },
});