import { useRef } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type FeedMode = 'listings' | 'roommates';

export type HomeSearchBarProps = {
  placeholder?: string;
  hasFilter?: boolean;
  onFilterPress?: () => void;
  currentMode: FeedMode;
  onSwipeDown: () => void;
  onOpenSearch: () => void;
  filtersOpen?: boolean;
  categories?: readonly string[];
  activeCategory?: string;
  onCategoryChange?: (value: string) => void;
};

export function HomeSearchBar({
  placeholder = 'Search...',
  hasFilter,
  onFilterPress,
  currentMode,
  onSwipeDown,
  onOpenSearch,
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
        <Pressable
          style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
          onPress={onOpenSearch}
        >
          <Ionicons name="search" size={18} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.placeholder} numberOfLines={1}>{placeholder}</Text>
          {hasFilter && (
            <Pressable
              style={styles.filterButton}
              onPress={(e) => {
                e.stopPropagation?.();
                onFilterPress?.();
              }}
            >
              <Ionicons name="options-outline" size={20} color={DesignColors.onSurfaceVariant} />
            </Pressable>
          )}
          <View style={styles.divider} />
          <Pressable
            style={styles.modeArea}
            onPress={(e) => {
              e.stopPropagation?.();
              onSwipeDown();
            }}
          >
            <Ionicons name="swap-vertical-outline" size={18} color={DesignColors.onSurface} />
          </Pressable>
        </Pressable>
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
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  fieldPressed: {
    opacity: 0.7,
  },
  placeholder: {
    flex: 1,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
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
    backgroundColor: DesignColors.cardBorder,
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
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  pillActive: {
    backgroundColor: DesignColors.primaryContainer,
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
