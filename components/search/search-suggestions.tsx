import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

const SUGGESTIONS = [
  'Self Contain',
  'Flat',
  '2 Bedroom',
  'Single Room',
  'Ikeja',
  'Lagos',
  'Minna',
  'Generator',
  'Internet',
  'FUTA',
  'FUT Minna',
];

type Props = {
  onSelect: (term: string) => void;
};

export function SearchSuggestions({ onSelect }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>Suggested</Text>
      <View style={styles.grid}>
        {SUGGESTIONS.map((term) => (
          <Pressable
            key={term}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={() => onSelect(term)}
          >
            <Text style={styles.chipText}>{term}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  label: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.surfaceContainer,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  chipPressed: {
    opacity: 0.6,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  chipText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
