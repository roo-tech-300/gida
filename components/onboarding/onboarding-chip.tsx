import { Pressable, StyleSheet, Text } from 'react-native';

import {
  DesignColors,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';

type OnboardingChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function OnboardingChip({ label, selected, onPress }: OnboardingChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm + 2,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  chipSelected: {
    backgroundColor: DesignColors.secondary,
    borderColor: DesignColors.secondary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  label: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    fontWeight: '500',
  },
  labelSelected: {
    color: DesignColors.onPrimary,
    fontWeight: '600',
  },
});
