import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function DiscoverCategories({ categories }: { categories: readonly string[] }) {
  return (
    <View style={styles.section}>
      <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {categories.map((category, index) => (
            <Pressable key={category} style={[styles.chip, index === 0 && styles.chipActive]}>
              <Text style={[styles.label, index === 0 && styles.labelActive]}>{category}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: DesignSpacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  chipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  label: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  labelActive: {
    color: DesignColors.onSurface,
    fontWeight: '600',
  },
});
