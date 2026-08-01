import { StyleSheet, Switch, Text, View } from 'react-native';

import { OnboardingGlassCard } from '@/components/onboarding/onboarding-glass-card';
import { RoommateChipSelector } from '@/components/roommate/roommate-chip-selector';
import {
  CLEANLINESS_OPTIONS,
  GUEST_OPTIONS,
  PERSONALITY_OPTIONS,
  SLEEP_OPTIONS,
  STUDY_OPTIONS,
} from '@/components/roommate/roommate-onboarding-options';
import {
  DesignColors,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';

type Props = {
  sleep: string | null;
  cleanliness: string | null;
  guests: string | null;
  study: string | null;
  personality: string | null;
  smoker: boolean;
  onSleepChange: (v: string) => void;
  onCleanlinessChange: (v: string) => void;
  onGuestsChange: (v: string) => void;
  onStudyChange: (v: string) => void;
  onPersonalityChange: (v: string) => void;
  onSmokerChange: (v: boolean) => void;
};

export function RoommateLifestyleSection({
  sleep,
  cleanliness,
  guests,
  study,
  personality,
  smoker,
  onSleepChange,
  onCleanlinessChange,
  onGuestsChange,
  onStudyChange,
  onPersonalityChange,
  onSmokerChange,
}: Props) {
  return (
    <OnboardingGlassCard>
      <Text style={styles.sectionTitle}>Lifestyle</Text>
      <RoommateChipSelector label="Sleep Schedule" options={SLEEP_OPTIONS} value={sleep} onSelect={onSleepChange} />
      <RoommateChipSelector label="Cleanliness" options={CLEANLINESS_OPTIONS} value={cleanliness} onSelect={onCleanlinessChange} />
      <RoommateChipSelector label="Guest Policy" options={GUEST_OPTIONS} value={guests} onSelect={onGuestsChange} />
      <RoommateChipSelector label="Study Habitat" options={STUDY_OPTIONS} value={study} onSelect={onStudyChange} />
      <RoommateChipSelector label="Personality" options={PERSONALITY_OPTIONS} value={personality} onSelect={onPersonalityChange} />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Smoker allowed?</Text>
        <Switch
          value={smoker}
          onValueChange={onSmokerChange}
          trackColor={{ false: DesignColors.surfaceContainerHighest, true: DesignColors.primary }}
          thumbColor={DesignColors.onSurface}
        />
      </View>
    </OnboardingGlassCard>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...DesignTypography.labelCaps,
    color: DesignColors.secondary,
    fontFamily,
    letterSpacing: 1.2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DesignSpacing.sm,
  },
  switchLabel: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily },
});
