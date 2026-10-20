import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { OnboardingGlassCard } from '@/components/onboarding/onboarding-glass-card';
import { RoommateChipSelector } from '@/components/roommate/roommate-chip-selector';
import {
  CLEANLINESS_OPTIONS,
  GUEST_OPTIONS,
  PERSONALITY_OPTIONS,
  RELIGION_PREFERENCE_OPTIONS,
  SLEEP_OPTIONS,
  STUDY_OPTIONS,
} from '@/components/roommate/roommate-onboarding-options';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { fetchMyRoommatePreferences } from '@/services/roommateProfileService';
import { RoommateMoreSaveButton } from './roommate-more-save-button';
import { useRoommateMoreSave } from './use-roommate-more-save';

export function RoommateMoreForm() {
  const { profile } = useAuth();
  const userId = profile?.id;

  const [sleep, setSleep] = useState<string | null>(null);
  const [cleanliness, setCleanliness] = useState<string | null>(null);
  const [guests, setGuests] = useState<string | null>(null);
  const [study, setStudy] = useState<string | null>(null);
  const [personality, setPersonality] = useState<string | null>(null);
  const [smoker, setSmoker] = useState(false);
  const [religionPreference, setReligionPreference] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<string | null>(null);

  const { data: preferences, isPending } = useQuery({
    queryKey: ['my-roommate-preferences', userId],
    queryFn: () => fetchMyRoommatePreferences(userId ?? ''),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const fresh = preferences?.roommate
    ? JSON.stringify({
        sleep: preferences.roommate.sleep_schedule,
        cleanliness: preferences.roommate.cleanliness_level,
        guests: preferences.roommate.guest_policy,
        study: preferences.roommate.study_habitat,
        personality: preferences.roommate.personality_vibe,
        smoker: preferences.roommate.smoker_allowed ?? false,
        religion: preferences.roommate.religion_preference,
      })
    : null;

  if (fresh && baseline === null) {
    const parsed = JSON.parse(fresh) as {
      sleep: string | null;
      cleanliness: string | null;
      guests: string | null;
      study: string | null;
      personality: string | null;
      smoker: boolean;
      religion: string | null;
    };
    setBaseline(fresh);
    setSleep(parsed.sleep);
    setCleanliness(parsed.cleanliness);
    setGuests(parsed.guests);
    setStudy(parsed.study);
    setPersonality(parsed.personality);
    setSmoker(parsed.smoker);
    setReligionPreference(parsed.religion);
  }

  const current = useMemo(
    () => JSON.stringify({
      sleep, cleanliness, guests, study, personality, smoker,
      religion: religionPreference,
    }),
    [sleep, cleanliness, guests, study, personality, smoker, religionPreference],
  );

  const dirty = baseline !== null && current !== baseline;

  const { saving, error, canSave, handleSave } = useRoommateMoreSave({
    userId,
    baseline,
    dirty,
    values: {
      sleepSchedule: sleep,
      cleanlinessLevel: cleanliness,
      guestPolicy: guests,
      studyHabitat: study,
      personalityVibe: personality,
      smokerAllowed: smoker,
      religionPreference,
    },
    onSaved: () => setBaseline(current),
  });

  return (
    <OnboardingGlassCard showGlow={false}>
      <View style={styles.header}>
        <Text style={styles.title}>More Settings</Text>
        <Text style={styles.subtitle}>Habits and preferences for matching.</Text>
      </View>
      {isPending ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
        </View>
      ) : (
        <>
          <RoommateChipSelector label="Sleep Schedule" options={SLEEP_OPTIONS} value={sleep} onSelect={setSleep} />
          <RoommateChipSelector label="Cleanliness" options={CLEANLINESS_OPTIONS} value={cleanliness} onSelect={setCleanliness} />
          <RoommateChipSelector label="Guest Policy" options={GUEST_OPTIONS} value={guests} onSelect={setGuests} />
          <RoommateChipSelector label="Study Habitat" options={STUDY_OPTIONS} value={study} onSelect={setStudy} />
          <RoommateChipSelector label="Personality" options={PERSONALITY_OPTIONS} value={personality} onSelect={setPersonality} />
          <RoommateChipSelector label="Religion Preference" options={RELIGION_PREFERENCE_OPTIONS} value={religionPreference} onSelect={setReligionPreference} />
          <Text style={styles.helper}>Same as mine saves your own religion; Flexible stays flexible.</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Smoker allowed?</Text>
            <Switch
              value={smoker}
              onValueChange={setSmoker}
              trackColor={{ false: DesignColors.surfaceContainerHighest, true: DesignColors.primary }}
              thumbColor={DesignColors.onSurface}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <RoommateMoreSaveButton saving={saving} canSave={canSave} onSave={handleSave} />
        </>
      )}
    </OnboardingGlassCard>
  );
}

const styles = StyleSheet.create({
  header: { gap: DesignSpacing.xs },
  title: { ...DesignTypography.headlineLg, color: DesignColors.onSurface, fontFamily, textAlign: 'center' },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },
  helper: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.85, textAlign: 'center' },
  error: { ...DesignTypography.bodyMd, color: DesignColors.error, fontFamily, textAlign: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: DesignSpacing.sm },
  switchLabel: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily },
  loader: { paddingVertical: DesignSpacing.xl, alignItems: 'center', justifyContent: 'center' },
});

