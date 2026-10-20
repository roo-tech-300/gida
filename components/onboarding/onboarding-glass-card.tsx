import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing } from '@/constants/design';

type OnboardingGlassCardProps = {
  children: ReactNode;
  /** Hides the decorative glow circle in the top-right corner. */
  showGlow?: boolean;
};

export function OnboardingGlassCard({ children, showGlow = true }: OnboardingGlassCardProps) {
  return (
    <View style={styles.card}>
      {showGlow ? <View style={styles.glow} pointerEvents="none" /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
    padding: DesignSpacing.xl,
    gap: DesignSpacing.lg,
    overflow: 'hidden',
    shadowColor: DesignColors.surfaceContainerLowest,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: DesignColors.primaryTint,
  },
});
