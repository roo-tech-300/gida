import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { CustomAlert, useCustomAlert } from '@/components/ui/custom-alert';
import { OnboardingLayout } from '@/components/onboarding/onboarding-layout';
import { RoommateAvatarSection } from '@/components/roommate/roommate-avatar-section';
import { RoommateAboutSection } from '@/components/roommate/roommate-about-section';
import { RoommateLifestyleSection } from '@/components/roommate/roommate-lifestyle-section';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { useRoommateVisibility } from '@/hooks/useRoommateVisibility';
import { birthYearFromAge, entryYearFromLevel } from '@/utils/academicLevel';

type Props = { visible: boolean; onDismiss: () => void };

export function RoommateOnboardingSheet({ visible, onDismiss }: Props) {
  const { needsOnboarding, isSubmitting, markComplete } = useRoommateVisibility();
  const { profile } = useAuth();
  const alert = useCustomAlert();
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [level, setLevel] = useState<string | null>(null);
  const [religion, setReligion] = useState('');
  const [smoker, setSmoker] = useState(false);
  const [sleep, setSleep] = useState<string | null>(null);
  const [cleanliness, setCleanliness] = useState<string | null>(null);
  const [guests, setGuests] = useState<string | null>(null);
  const [study, setStudy] = useState<string | null>(null);
  const [personality, setPersonality] = useState<string | null>(null);

  const handleSubmit = () => {
    alert.showAlert({
      title: 'Visibility Confirmation',
      message: 'Your profile will be visible to people searching for roommates. You can update your info anytime from your profile.',
      buttons: [
        { label: 'Cancel', style: 'cancel' },
        {
          label: 'Accept', style: 'primary',
          onPress: async () => {
            try {
              await markComplete({
                bio: bio || undefined,
                birthYear: age ? birthYearFromAge(Number(age)) : undefined,
                entryYear: level ? entryYearFromLevel(Number(level)) : undefined,
                religion: religion || undefined,
                sleepSchedule: sleep || undefined,
                cleanlinessLevel: cleanliness || undefined,
                guestPolicy: guests || undefined,
                studyHabitat: study || undefined,
                personalityVibe: personality || undefined,
                smokerAllowed: smoker,
                religionPreference: 'any',
              });
              onDismiss();
            } catch (err) {
              console.error('[RoommateOnboarding] Failed:', err);
            }
          },
        },
      ],
    });
  };

  if (!needsOnboarding) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <OnboardingLayout>
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>Help others find you as a roommate</Text>
        {!profile?.avatar_url && <RoommateAvatarSection />}
        <RoommateAboutSection bio={bio} age={age} level={level} religion={religion} onBioChange={setBio} onAgeChange={setAge} onLevelChange={setLevel} onReligionChange={setReligion} />
        <RoommateLifestyleSection sleep={sleep} cleanliness={cleanliness} guests={guests} study={study} personality={personality} smoker={smoker} onSleepChange={setSleep} onCleanlinessChange={setCleanliness} onGuestsChange={setGuests} onStudyChange={setStudy} onPersonalityChange={setPersonality} onSmokerChange={setSmoker} />
        <Pressable onPress={handleSubmit} disabled={isSubmitting} style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}>
          <Text style={styles.submitText}>{isSubmitting ? 'Saving...' : 'Complete Profile'}</Text>
        </Pressable>
        <CustomAlert visible={alert.visible} title={alert.title} message={alert.message} buttons={alert.buttons} onDismiss={alert.hideAlert} />
      </OnboardingLayout>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: { ...DesignTypography.headlineLg, color: DesignColors.onSurface, fontFamily, textAlign: 'center', marginBottom: DesignSpacing.xs },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center', marginBottom: DesignSpacing.md },
  submitBtn: { height: 48, borderRadius: DesignRadius.md, backgroundColor: DesignColors.secondary, alignItems: 'center', justifyContent: 'center', marginTop: DesignSpacing.md },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  submitText: { ...DesignTypography.bodyLg, color: DesignColors.onPrimary, fontFamily, fontWeight: '600' },
});
