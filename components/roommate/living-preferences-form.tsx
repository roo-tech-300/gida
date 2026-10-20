import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { AuthInput } from '@/components/auth/auth-input';
import { OnboardingGlassCard } from '@/components/onboarding/onboarding-glass-card';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import {
  fetchLivingPreferences,
  updateLivingPreferences,
} from '@/services/livingPreferencesService';
import { LivingPreferencesSaveButton } from './living-preferences-save-button';

function toMoneyInput(value: number | null | undefined): string {
  return value == null ? '' : String(value);
}

export function LivingPreferencesForm() {
  const { profile } = useAuth();
  const { showToast } = useAppToast();
  const queryClient = useQueryClient();
  const userId = profile?.id;

  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [preferredArea, setPreferredArea] = useState('');
  const [preferredLayout, setPreferredLayout] = useState('');
  const [minBedrooms, setMinBedrooms] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const { data: living, isError, isPending } = useQuery({
    queryKey: ['living-preferences', userId],
    queryFn: () => fetchLivingPreferences(userId ?? ''),
    enabled: !!userId,
  });

  const hydratedSnapshot = living
    ? JSON.stringify({
        min: toMoneyInput(living.min_budget),
        max: toMoneyInput(living.max_budget),
        area: living.preferred_area ?? '',
        layout: living.preferred_layout ?? '',
        beds: living.min_bedrooms == null ? '' : String(living.min_bedrooms),
      })
    : null;

  useEffect(() => {
    if (hydratedSnapshot && !hydrated) {
      const parsed = JSON.parse(hydratedSnapshot) as {
        min: string;
        max: string;
        area: string;
        layout: string;
        beds: string;
      };
      queueMicrotask(() => {
        setMinBudget(parsed.min);
        setMaxBudget(parsed.max);
        setPreferredArea(parsed.area);
        setPreferredLayout(parsed.layout);
        setMinBedrooms(parsed.beds);
        setHydrated(true);
      });
    }
  }, [hydratedSnapshot, hydrated]);

  useEffect(() => {
    if (isError) {
      showToast({ message: 'Could not load your living preferences.', type: 'error' });
    }
  }, [isError, showToast]);

  const snapshot = JSON.stringify({
    min: minBudget.trim(),
    max: maxBudget.trim(),
    area: preferredArea.trim(),
    layout: preferredLayout.trim(),
    beds: minBedrooms.trim(),
  });
  const baseline = living
    ? JSON.stringify({
        min: toMoneyInput(living.min_budget),
        max: toMoneyInput(living.max_budget),
        area: (living.preferred_area ?? '').trim(),
        layout: (living.preferred_layout ?? '').trim(),
        beds: living.min_bedrooms == null ? '' : String(living.min_bedrooms),
      })
    : JSON.stringify({ min: '', max: '', area: '', layout: '', beds: '' });
  const canSave = snapshot !== baseline && !saving;

  const handleSave = useCallback(async () => {
    if (!userId) return;
    const min = Number(minBudget);
    const max = Number(maxBudget);
    const beds = Number(minBedrooms);
    if (minBudget.trim() === '' || Number.isNaN(min) || min < 0) {
      setError('Enter the minimum budget (₦).');
      return;
    }
    if (maxBudget.trim() === '' || Number.isNaN(max) || max < 0) {
      setError('Enter the maximum budget (₦).');
      return;
    }
    if (min > max) {
      setError('Minimum budget cannot exceed maximum budget.');
      return;
    }
    if (minBedrooms.trim() === '' || !Number.isInteger(beds) || beds < 1) {
      setError('Minimum bedrooms must be a whole number of 1 or more.');
      return;
    }

    setError(undefined);
    setSaving(true);
    try {
      await updateLivingPreferences(userId, {
        minBudget: min,
        maxBudget: max,
        preferredArea: preferredArea.trim() || null,
        preferredLayout: preferredLayout.trim() || null,
        minBedrooms: beds,
      });
      await queryClient.invalidateQueries({ queryKey: ['living-preferences', userId] });
      await queryClient.invalidateQueries({ queryKey: ['my-roommate-preferences', userId] });
      setHydrated(false);
      showToast({ type: 'success', message: 'Living preferences saved.' });
    } catch (e) {
      console.error('[LivingPreferences] Save failed:', e);
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Could not save living preferences.',
      });
    } finally {
      setSaving(false);
    }
  }, [userId, minBudget, maxBudget, preferredArea, preferredLayout, minBedrooms, queryClient, showToast]);

  return (
    <OnboardingGlassCard showGlow={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Living Preferences</Text>
        <Text style={styles.subtitle}>Where you want to live and what you need.</Text>
      </View>
      {isPending ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
        </View>
      ) : (
        <>
          <AuthInput label="Minimum budget (₦)" value={minBudget} placeholder="e.g. 150000" keyboardType="decimal-pad" onChangeText={setMinBudget} />
          <AuthInput label="Maximum budget (₦)" value={maxBudget} placeholder="e.g. 300000" keyboardType="decimal-pad" onChangeText={setMaxBudget} />
          <AuthInput label="Preferred area" value={preferredArea} placeholder="e.g. Bosso, Tunga" onChangeText={setPreferredArea} />
          <AuthInput label="Preferred layout" value={preferredLayout} placeholder="e.g. Self-contain" onChangeText={setPreferredLayout} />
          <AuthInput label="Minimum bedrooms" value={minBedrooms} placeholder="e.g. 1" keyboardType="number-pad" onChangeText={setMinBedrooms} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <LivingPreferencesSaveButton saving={saving} canSave={canSave} onSave={handleSave} />
        </>
      )}
    </OnboardingGlassCard>
  );
}

const styles = StyleSheet.create({
  header: { gap: DesignSpacing.xs },
  title: { ...DesignTypography.headlineLg, color: DesignColors.onSurface, fontFamily, textAlign: 'center' },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center', lineHeight: 22 },
  helper: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.85, textAlign: 'center' },
  error: { ...DesignTypography.bodyMd, color: DesignColors.error, fontFamily, textAlign: 'center' },
  loader: { paddingVertical: DesignSpacing.xl, alignItems: 'center', justifyContent: 'center' },
});

