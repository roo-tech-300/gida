import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AmenityGrid } from '@/components/onboarding/onboarding-amenity-grid';
import { OnboardingGlassCard } from '@/components/onboarding/onboarding-glass-card';
import { OnboardingLayout } from '@/components/onboarding/onboarding-layout';
import { OnboardingNavRow } from '@/components/onboarding/onboarding-nav-row';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { OnboardingChip } from '@/components/onboarding/onboarding-chip';
import { useAppToast } from '@/components/ui/toast-card';
import {
  DesignColors,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';
import { useOnboarding } from '@/context/onboarding-context';
import { useAuth } from '@/context/auth-context';
import { saveOnboardingProfile } from '@/services/profileService';
import { AMENITY_OPTIONS, LAYOUT_OPTIONS } from '@/types/onboarding';
import type { LayoutType, Amenity } from '@/types/onboarding';

export default function OnboardingLayoutScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data, updateData } = useOnboarding();
  const { profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleLayoutSelect = (id: LayoutType) => {
    updateData({ preferredLayout: id });
  };

  const handleAmenityToggle = (id: Amenity) => {
    const current = data.mustHaveAmenities;
    const updated = current.includes(id)
      ? current.filter((a) => a !== id)
      : [...current, id];
    updateData({ mustHaveAmenities: updated });
  };

  const handleSubmit = async () => {
    if (!data.preferredLayout) {
      showToast({ type: 'error', message: 'Please select a preferred layout.' });
      return;
    }
    if (!profile?.id) {
      showToast({ type: 'error', message: 'User not found. Please sign in again.' });
      return;
    }

    setSaving(true);
    try {
      await saveOnboardingProfile(profile.id, data);
      await refreshProfile();
    } catch (err) {
      console.error('[Onboarding] Failed to save:', err);
      showToast({ type: 'error', message: 'Failed to save preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingLayout>
      <OnboardingProgress step={2} label="Layout & Amenities" />

      <OnboardingGlassCard>
        <View style={styles.header}>
          <Text style={styles.title}>Preferred layout</Text>
          <Text style={styles.subtitle}>What type of space are you looking for?</Text>
        </View>

        <View style={styles.chipRow}>
          {LAYOUT_OPTIONS.map((opt) => (
            <OnboardingChip
              key={opt.id}
              label={opt.label}
              selected={data.preferredLayout === opt.id}
              onPress={() => handleLayoutSelect(opt.id)}
            />
          ))}
        </View>
      </OnboardingGlassCard>

      <OnboardingGlassCard>
        <View style={styles.header}>
          <Text style={styles.title}>Must-have amenities</Text>
          <Text style={styles.subtitle}>Select all that matter to you (optional).</Text>
        </View>

        <AmenityGrid
          options={AMENITY_OPTIONS}
          selected={data.mustHaveAmenities}
          onToggle={handleAmenityToggle}
        />
      </OnboardingGlassCard>

      <OnboardingNavRow
        onBack={() => router.back()}
        onContinue={handleSubmit}
        continueLabel="Get Started"
        isLoading={saving}
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
    justifyContent: 'center',
  },
});
