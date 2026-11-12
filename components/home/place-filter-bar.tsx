import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { FUT_MINNA_AREAS } from '@/types/onboarding';
import {
  activeFilterCount, BUDGET_STEPS, formatBudgetShort, LAYOUT_LABELS, type LayoutFilter, type PlaceFilters,
} from '@/utils/place-filters';

import { PlaceFilterSheet, type FilterOption } from './place-filter-sheet';

type FilterKey = 'budget' | 'area' | 'layout';

type Props = {
  filters: PlaceFilters;
  onChange: (patch: Partial<PlaceFilters>) => void;
  onClear: () => void;
};

const SHEET_TITLES: Record<FilterKey, string> = {
  budget: 'Rent per person, per year',
  area: 'Area',
  layout: 'Room type',
};

export function PlaceFilterBar({ filters, onChange, onClear }: Props) {
  const [open, setOpen] = useState<FilterKey | null>(null);
  const count = activeFilterCount(filters);

  const options = useMemo<FilterOption[]>(() => {
    if (open === 'budget') {
      return BUDGET_STEPS.map((step) => ({ key: String(step), label: `Up to ${formatBudgetShort(step)}`, selected: filters.maxBudget === step }));
    }
    if (open === 'area') return FUT_MINNA_AREAS.map((area) => ({ key: area, label: area, selected: filters.area === area }));
    if (open === 'layout') {
      return (Object.keys(LAYOUT_LABELS) as LayoutFilter[]).map((key) => ({ key, label: LAYOUT_LABELS[key], selected: filters.layout === key }));
    }
    return [];
  }, [open, filters]);

  const select = (key: string | null) => {
    if (open === 'budget') onChange({ maxBudget: key === null ? null : Number(key) });
    if (open === 'area') onChange({ area: key });
    if (open === 'layout') onChange({ layout: key as LayoutFilter | null });
    setOpen(null);
  };

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} testID="place-filter-bar">
        <Chip label={filters.maxBudget ? `Up to ${formatBudgetShort(filters.maxBudget)}` : 'Budget'} active={filters.maxBudget !== null} onPress={() => setOpen('budget')} />
        <Chip label={filters.area ?? 'Area'} active={filters.area !== null} onPress={() => setOpen('area')} />
        <Chip label={filters.layout ? LAYOUT_LABELS[filters.layout] : 'Room type'} active={filters.layout !== null} onPress={() => setOpen('layout')} />
        {count > 0 ? (
          <Pressable onPress={onClear} style={styles.clear} accessibilityRole="button" testID="place-filter-clear">
            <Ionicons name="close-circle" size={16} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <PlaceFilterSheet visible={open !== null} title={open ? SHEET_TITLES[open] : ''} options={options} onSelect={select} onClose={() => setOpen(null)} />
    </>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      <Ionicons name="chevron-down" size={14} color={active ? DesignColors.onPrimary : DesignColors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: DesignSpacing.marginMobile, gap: DesignSpacing.sm, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 19,
    backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.borderMedium,
  },
  chipActive: { backgroundColor: DesignColors.primary, borderColor: DesignColors.primary },
  chipText: { ...DesignTypography.labelLg, color: DesignColors.onSurfaceVariant, fontFamily },
  chipTextActive: { color: DesignColors.onPrimary, fontWeight: '700' },
  clear: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 38, paddingHorizontal: 8 },
  clearText: { ...DesignTypography.labelLg, color: DesignColors.onSurfaceVariant, fontFamily },
});
