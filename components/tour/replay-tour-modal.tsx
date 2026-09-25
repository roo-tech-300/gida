import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AppTourCard } from './app-tour-card';
import { TourControls } from './tour-controls';
import { DesignColors, DesignRadius, DesignSpacing } from '@/constants/design';
import { APP_TOUR_STEPS } from '@/dummy/app-tour-data';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ReplayTourModal({ visible, onClose }: Props) {
  if (!visible) return null;
  return <ReplayTourContent onClose={onClose} />;
}

function ReplayTourContent({ onClose }: { onClose: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const totalSteps = APP_TOUR_STEPS.length;
  const currentStep = APP_TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex === totalSteps - 1;
  const canGoBack = stepIndex > 0;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
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
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.outsideOverlay} onPress={onClose} />
        <SafeAreaView style={styles.dialogWrap}>
          <View style={styles.dialog}>
            <Pressable
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
              onPress={onClose}>
              <Ionicons name="close" size={20} color={DesignColors.onSurfaceVariant} />
            </Pressable>

            <AppTourCard
              step={currentStep}
              totalSteps={totalSteps}
              activeIndex={stepIndex}
            />

            <TourControls
              isLastStep={isLastStep}
              canGoBack={canGoBack}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={onClose}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outsideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialogWrap: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: DesignSpacing.marginMobile,
  },
  dialog: {
    backgroundColor: DesignColors.surfaceContainerLowest,
    borderRadius: DesignRadius.xl,
    padding: DesignSpacing.md,
    gap: DesignSpacing.sm,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
  },
});
