import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing } from '@/constants/design';

type OnboardingGlassCardProps = {
  children: ReactNode;
};

export function OnboardingGlassCard({ children }: OnboardingGlassCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.glow} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1e',
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: DesignSpacing.xl,
    gap: DesignSpacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
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
    backgroundColor: 'rgba(54, 71, 54, 0.12)',
  },
});
