import React, { useState } from 'react';
import { useRouter } from 'expo-router';

import { AppTourCard } from '@/components/tour/app-tour-card';
import { OnboardingLayout } from '@/components/onboarding/onboarding-layout';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { TourControls } from '@/components/tour/tour-controls';
import { useAppToast } from '@/components/ui/toast-card';
import { useAuth } from '@/context/auth-context';
import { APP_TOUR_STEPS } from '@/dummy/app-tour-data';
import { completeOnboardingProfile } from '@/services/profileService';

export default function AppTourScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useAppToast();
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = APP_TOUR_STEPS.length;
  const currentStep = APP_TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex === totalSteps - 1;
  const canGoBack = stepIndex > 0;

  const handleComplete = async () => {
    if (!profile?.id) {
      router.replace('/(tabs)');
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboardingProfile(profile.id);
      try {
        await refreshProfile();
      } catch (refreshErr) {
        console.error('[AppTour] Failed to refresh profile:', refreshErr);
      }
      router.replace('/(tabs)');
    } catch (error) {
      console.error('[AppTour] Error completing onboarding:', error);
      showToast({ type: 'error', message: 'Could not complete setup. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      void handleComplete();
    } else {
      setStepIndex((curr) => curr + 1);
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      setStepIndex((curr) => curr - 1);
    }
  };

  return (
    <OnboardingLayout>
      <OnboardingProgress step={5} label="Welcome to Gida" />
      <AppTourCard
        step={currentStep}
        totalSteps={totalSteps}
        activeIndex={stepIndex}
      />
      <TourControls
        isLastStep={isLastStep}
        canGoBack={canGoBack}
        isSubmitting={submitting}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={() => void handleComplete()}
      />
    </OnboardingLayout>
  );
}
