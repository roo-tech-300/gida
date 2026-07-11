import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { SearchBar } from '@/components/ui/search-bar';
export function DiscoverFeedHeader({
  query,
  onQueryChange,
  filtersOpen,
  onToggleFilters,
  categories,
  activeCategory,
  onCategoryChange,
  searchPlaceholder = 'Locations and property type',
}: {
  query: string;
  onQueryChange: (value: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  categories?: readonly string[];
  activeCategory?: string;
  onCategoryChange?: (value: string) => void;
  searchPlaceholder?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <SearchBar value={query} onChangeText={onQueryChange} placeholder={searchPlaceholder} hasFilter onFilterPress={onToggleFilters} />

        {filtersOpen && categories ? (
          <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false}>
            <View style={styles.pillsRow}>
              <CategoryPill label="All" active={activeCategory === 'All'} onPress={() => onCategoryChange?.('All')} />
              {categories.map((cat) => (
                <CategoryPill
                  key={cat}
                  label={cat}
                  active={activeCategory === cat}
                  onPress={() => onCategoryChange?.(cat)}
                />
              ))}
            </View>
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

function CategoryPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 150,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.md,
    paddingBottom: DesignSpacing.sm,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(26, 26, 30, 0.82)',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  pillActive: {
    backgroundColor: DesignColors.primary,
  },
  pillText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  pillTextActive: {
    color: DesignColors.onPrimary,
    fontWeight: '600',
  },
});
