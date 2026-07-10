import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
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
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={DesignColors.onSurfaceVariant} />
          <TextInput
            placeholder={searchPlaceholder}
            placeholderTextColor={DesignColors.onSurfaceVariant}
            returnKeyType="search"
            style={styles.input}
            value={query}
            onChangeText={onQueryChange}
          />
          <Pressable accessibilityRole="button" onPress={onToggleFilters} style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color={DesignColors.onSurfaceVariant} />
          </Pressable>
        </View>

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
  searchBar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.md,
    borderRadius: 32,
    backgroundColor: 'rgba(26, 26, 30, 0.45)',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  input: {
    flex: 1,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    paddingVertical: 0,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
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
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  pillText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  pillTextActive: {
    color: DesignColors.onSurface,
    fontWeight: '600',
  },
});
