import { StyleSheet, Text, TextInput, View } from 'react-native';
import { OnboardingGlassCard } from '@/components/onboarding/onboarding-glass-card';
import { RoommateChipSelector } from '@/components/roommate/roommate-chip-selector';
import { LEVEL_OPTIONS } from '@/components/roommate/roommate-onboarding-options';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  bio: string; age: string; level: string | null; religion: string;
  onBioChange: (v: string) => void;
  onAgeChange: (v: string) => void;
  onLevelChange: (id: string) => void;
  onReligionChange: (v: string) => void;
};

export function RoommateAboutSection({
  bio, age, level, religion,
  onBioChange, onAgeChange, onLevelChange, onReligionChange,
}: Props) {
  return (
    <OnboardingGlassCard>
      <Text style={styles.sectionTitle}>About You</Text>
      <TextInput placeholder="Write a short bio..." placeholderTextColor={DesignColors.textSecondary} value={bio} onChangeText={onBioChange} multiline numberOfLines={3} style={styles.textArea} />
      <TextInput placeholder="Age" placeholderTextColor={DesignColors.textSecondary} value={age} onChangeText={onAgeChange} keyboardType="numeric" style={styles.textInput} />
      <RoommateChipSelector label="Level" options={LEVEL_OPTIONS} value={level} onSelect={onLevelChange} />
      <TextInput placeholder="Religion (e.g. Islam, Christianity)" placeholderTextColor={DesignColors.textSecondary} value={religion} onChangeText={onReligionChange} style={styles.textInput} />
    </OnboardingGlassCard>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...DesignTypography.labelCaps, color: DesignColors.secondary, fontFamily, letterSpacing: 1.2 },
  textArea: { height: 80, backgroundColor: DesignColors.surfaceContainerHigh, borderRadius: DesignRadius.md, borderWidth: 1, borderColor: DesignColors.cardBorder, padding: DesignSpacing.md, ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, textAlignVertical: 'top' },
  textInput: { height: 48, backgroundColor: DesignColors.surfaceContainerHigh, borderRadius: DesignRadius.md, borderWidth: 1, borderColor: DesignColors.cardBorder, paddingHorizontal: DesignSpacing.md, ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily },
});
