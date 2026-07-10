import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  DesignColors,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';

type OnboardingOptionCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

export function OnboardingOptionCard({
  title,
  description,
  icon,
  selected,
  onPress,
}: OnboardingOptionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons name={icon} size={28} color={selected ? '#ffffff' : DesignColors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    padding: DesignSpacing.lg,
    borderRadius: DesignRadius.lg,
    backgroundColor: '#1a1a1e',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  cardSelected: {
    borderColor: DesignColors.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    shadowColor: DesignColors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: DesignColors.primary,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontSize: 18,
  },
  description: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DesignColors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: DesignColors.primary,
    backgroundColor: DesignColors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
});
