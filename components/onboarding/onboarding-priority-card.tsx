import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  DesignColors,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';

type OnboardingPriorityCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

export function OnboardingPriorityCard({
  title,
  description,
  icon,
  selected,
  onPress,
}: OnboardingPriorityCardProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons name={icon} size={22} color={selected ? '#ffffff' : DesignColors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
        <Text style={[styles.description, selected && styles.descriptionSelected]}>{description}</Text>
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
    backgroundColor: 'rgba(26, 26, 30, 0.8)',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  cardSelected: {
    backgroundColor: DesignColors.primary,
    borderColor: DesignColors.primary,
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  titleSelected: {
    color: '#ffffff',
  },
  description: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  descriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
