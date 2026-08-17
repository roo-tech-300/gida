import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';

type Props = {
  value: boolean | null;
  onChange: (value: boolean) => void;
};

type Option = {
  key: 'yes' | 'no';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

const OPTIONS: Option[] = [
  {
    key: 'yes',
    icon: 'people-outline',
    title: 'Yes, I want roommates',
    description: 'Pick friends, get matched, or a mix of both.',
  },
  {
    key: 'no',
    icon: 'person-outline',
    title: 'No, just me',
    description: 'Take the entire property privately.',
  },
];

export function RoommatePrompt({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const selected = value === (option.key === 'yes');
        return (
          <Pressable
            key={option.key}
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => onChange(option.key === 'yes')}
            testID={`roommates-${option.key}`}
          >
            <View style={[styles.iconCircle, selected && styles.iconCircleSelected]}>
              <Ionicons
                name={option.icon}
                size={20}
                color={selected ? DesignColors.primaryBright : DesignColors.onSurfaceVariant}
              />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.title, selected && styles.titleSelected]}>{option.title}</Text>
              <Text style={styles.description}>{option.description}</Text>
            </View>
            {selected && (
              <View style={styles.check}>
                <Ionicons name="checkmark" size={13} color={DesignColors.onPrimary} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: DesignSpacing.sm + 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    paddingVertical: DesignSpacing.md,
    paddingHorizontal: DesignSpacing.md,
  },
  cardSelected: {
    borderColor: DesignColors.primaryBright,
    backgroundColor: DesignColors.primaryTint,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: { backgroundColor: DesignColors.primaryTintMid },
  copy: { flex: 1, gap: 2, paddingRight: 4 },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: DesignColors.onSurface,
    fontFamily,
  },
  titleSelected: { color: DesignColors.onPrimaryContainer },
  description: {
    fontSize: 12,
    lineHeight: 16,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DesignColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
