import { OnboardingContinueButton } from '@/components/onboarding/onboarding-continue-button';

type Props = {
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
};

export function RoommateMoreSaveButton({ saving, canSave, onSave }: Props) {
  return (
    <OnboardingContinueButton
      label="Save"
      showArrow={false}
      labelColor="#FFFFFF"
      onPress={onSave}
      disabled={!canSave}
      isLoading={saving}
    />
  );
}
