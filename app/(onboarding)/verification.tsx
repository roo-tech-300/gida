import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useAuth } from '@/context/auth-context';
import { saveOnboardingProfile } from '@/services/profileService';
import { SCHOOLS } from '@/types/onboarding';

export default function OnboardingVerificationScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data, updateData, resetData } = useOnboarding();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [schoolOpen, setSchoolOpen] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      if (!profile?.id) {
        throw new Error('You must be signed in to complete onboarding.');
      }

      await saveOnboardingProfile(profile.id, data);
      resetData();
      showToast({ type: 'success', message: 'Profile setup complete!' });
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save your profile.';
      showToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout>
      <OnboardingProgress step={4} label="Student Verification" />

      <OnboardingGlassCard>
        <View style={styles.header}>
          <Text style={styles.title}>Are you a student?</Text>
          <Text style={styles.subtitle}>
            Verify your status to unlock exclusive student rental benefits and lower security deposits.
          </Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <View style={styles.toggleIcon}>
              <Ionicons name="school-outline" size={22} color={DesignColors.primary} />
            </View>
            <Text style={styles.toggleLabel}>I am a student</Text>
          </View>
          <Switch
            value={data.isStudent}
            onValueChange={(value) => updateData({ isStudent: value })}
            trackColor={{ false: DesignColors.surfaceContainerHighest, true: DesignColors.primary }}
            thumbColor="#ffffff"
          />
        </View>

        {data.isStudent ? (
          <View style={styles.schoolSection}>
            <Text style={styles.schoolLabel}>Select your school</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSchoolOpen((open) => !open)}
              style={styles.schoolSelect}>
              <Ionicons name="business-outline" size={20} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.schoolValue}>{data.school}</Text>
              <Ionicons
                name={schoolOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={DesignColors.onSurfaceVariant}
              />
            </Pressable>

            {schoolOpen ? (
              <View style={styles.schoolList}>
                {SCHOOLS.map((school) => (
                  <Pressable
                    key={school}
                    accessibilityRole="menuitem"
                    onPress={() => {
                      updateData({ school });
                      setSchoolOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.schoolOption,
                      data.school === school && styles.schoolOptionActive,
                      pressed && styles.schoolOptionPressed,
                    ]}>
                    <Text
                      style={[
                        styles.schoolOptionText,
                        data.school === school && styles.schoolOptionTextActive,
                      ]}>
                      {school}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.banner}>
              <Ionicons name="checkmark-circle" size={20} color={DesignColors.secondary} />
              <Text style={styles.bannerText}>
                Institutional partnership detected. Your verification will be instant.
              </Text>
            </View>
          </View>
        ) : null}
      </OnboardingGlassCard>

      <OnboardingNavRow
        onBack={() => router.back()}
        onContinue={handleFinish}
        continueLabel="Finish"
        isLoading={loading}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    flex: 1,
  },
  toggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    flexShrink: 1,
  },
  schoolSection: {
    gap: DesignSpacing.md,
  },
  schoolLabel: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    paddingHorizontal: 4,
  },
  schoolSelect: {
    minHeight: 64,
    borderRadius: 20,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(149, 141, 161, 0.3)',
    paddingHorizontal: DesignSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  schoolValue: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    flex: 1,
  },
  schoolList: {
    borderRadius: DesignRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  schoolOption: {
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.md,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  schoolOptionActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  schoolOptionPressed: {
    opacity: 0.9,
  },
  schoolOptionText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  schoolOptionTextActive: {
    color: DesignColors.primaryBright,
    fontWeight: '600',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DesignSpacing.md,
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.lg,
    backgroundColor: 'rgba(74, 225, 118, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74, 225, 118, 0.2)',
  },
  bannerText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.secondary,
    fontFamily,
    flex: 1,
    lineHeight: 20,
  },
});
