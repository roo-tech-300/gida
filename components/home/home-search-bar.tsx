import { useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type FeedMode = 'listings' | 'roommates';

export type HomeSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  hasFilter?: boolean;
  onFilterPress?: () => void;
  currentMode: FeedMode;
  onSwipeDown: () => void;
  filtersOpen?: boolean;
  categories?: readonly string[];
  activeCategory?: string;
  onCategoryChange?: (value: string) => void;
};

export function HomeSearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  hasFilter,
  onFilterPress,
  currentMode,
  onSwipeDown,
  filtersOpen,
  categories,
  activeCategory,
  onCategoryChange,
}: HomeSearchBarProps) {
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 40 || g.vy > 0.3) onSwipeDown();
      },
    }),
  ).current;

  return (
    <View style={styles.wrap}>
      <View style={styles.row} {...pan.panHandlers}>
        <View style={styles.field}>
          <Ionicons name="search" size={18} color={DesignColors.onSurfaceVariant} />
          <TextInput
            placeholder={placeholder}
            placeholderTextColor={DesignColors.onSurfaceVariant}
            returnKeyType="search"
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
          />
          {hasFilter && (
            <Pressable style={styles.filterButton} onPress={onFilterPress}>
              <Ionicons name="options-outline" size={20} color={DesignColors.onSurfaceVariant} />
            </Pressable>
          )}
          <View style={styles.divider} />
          <Pressable style={styles.modeArea} onPress={onSwipeDown}>
            <Ionicons name="swap-vertical-outline" size={18} color={DesignColors.onPrimary} />
          </Pressable>
        </View>
      </View>

      {filtersOpen && categories && (
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
      )}
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
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.md,
    paddingBottom: DesignSpacing.sm,
  },
  row: {
    minHeight: 56,
    justifyContent: 'center',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modeArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 4,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: DesignColors.primary,
    fontFamily,
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
