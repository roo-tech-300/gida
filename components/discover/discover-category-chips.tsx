import { ScrollView, StyleSheet } from 'react-native';

import { CategoryChip } from '@/components/ui/category-chip';
import { DesignSpacing } from '@/constants/design';
import { PLACE_CATEGORIES } from '@/constants/place-categories';
import type { DiscoverCategoryFilter } from '@/hooks/use-discover-feed';

type Props = {
  active: DiscoverCategoryFilter;
  savedOnly: boolean;
  onChange: (category: DiscoverCategoryFilter) => void;
  onToggleSaved: () => void;
};

export function DiscoverCategoryChips({ active, savedOnly, onChange, onToggleSaved }: Props) {
  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.content}
      showsHorizontalScrollIndicator={false}
    >
      <CategoryChip
        active={!savedOnly && active === 'all'}
        icon="grid-outline"
        label="All"
        onPress={() => onChange('all')}
      />
      {PLACE_CATEGORIES.map((category) => (
        <CategoryChip
          key={category.key}
          active={!savedOnly && active === category.key}
          icon={category.icon}
          label={category.label}
          onPress={() => onChange(category.key)}
        />
      ))}
      <CategoryChip active={savedOnly} label="Saved" onPress={onToggleSaved} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: DesignSpacing.marginMobile,
    gap: 8,
    paddingVertical: 2,
  },
});