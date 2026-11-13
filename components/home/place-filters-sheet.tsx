import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { FUT_MINNA_AREAS } from '@/types/onboarding';
import {
  activeFilterCount, BUDGET_STEPS, formatBudgetShort, LAYOUT_LABELS, type LayoutFilter, type PlaceFilters,
} from '@/utils/place-filters';

type Props = {
  visible: boolean;
  filters: PlaceFilters;
  resultCount: number;
  onChange: (patch: Partial<PlaceFilters>) => void;
  onClear: () => void;
  onClose: () => void;
};

const LAYOUTS = Object.keys(LAYOUT_LABELS) as LayoutFilter[];

function toggle<T>(current: T | null, value: T): T | null {
  return current === value ? null : value;
}

/** One bottom sheet for every place filter. Closes on outside tap, Escape or the system back button. */
export function PlaceFiltersSheet({ visible, filters, resultCount, onChange, onClear, onClose }: Props) {
  useEscapeKey(onClose, visible);
  const count = activeFilterCount(filters);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" testID="filter-sheet-backdrop">
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.grabber} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Filters</Text>
            {count > 0 ? (
              <Pressable onPress={onClear} accessibilityRole="button" testID="place-filter-clear">
                <Text style={styles.clear}>Clear all</Text>
              </Pressable>
            ) : null}
          </View>
          <ScrollView bounces={false} style={styles.body} showsVerticalScrollIndicator={false}>
            <Section label="Rent per person, per year">
              {BUDGET_STEPS.map((step) => (
                <Chip key={step} label={`Up to ${formatBudgetShort(step)}`} on={filters.maxBudget === step}
                  onPress={() => onChange({ maxBudget: toggle(filters.maxBudget, step) })} />
              ))}
            </Section>
            <Section label="Area">
              {FUT_MINNA_AREAS.map((area) => (
                <Chip key={area} label={area} on={filters.area === area} onPress={() => onChange({ area: toggle(filters.area, area) })} />
              ))}
            </Section>
            <Section label="Room type">
              {LAYOUTS.map((key) => (
                <Chip key={key} label={LAYOUT_LABELS[key]} on={filters.layout === key} onPress={() => onChange({ layout: toggle(filters.layout, key) })} />
              ))}
            </Section>
          </ScrollView>
          <Pressable style={styles.done} onPress={onClose} accessibilityRole="button" testID="filter-sheet-done">
            <Text style={styles.doneText}>Show {resultCount} {resultCount === 1 ? 'place' : 'places'}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: DesignColors.scrimHeavy },
  sheet: {
    maxHeight: '80%', paddingHorizontal: DesignSpacing.marginMobile, paddingBottom: DesignSpacing.xl, paddingTop: DesignSpacing.sm,
    borderTopLeftRadius: DesignRadius.xl, borderTopRightRadius: DesignRadius.xl, backgroundColor: DesignColors.surface,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: DesignColors.borderStrong, marginBottom: DesignSpacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: DesignSpacing.sm },
  title: { ...DesignTypography.headlineMd, fontSize: 20, color: DesignColors.onSurface, fontFamily, fontWeight: '800' },
  clear: { ...DesignTypography.labelLg, color: DesignColors.primaryBright, fontFamily, fontWeight: '700' },
  body: { flexGrow: 0 },
  section: { marginBottom: DesignSpacing.lg },
  sectionLabel: { ...DesignTypography.labelLg, color: DesignColors.onSurfaceVariant, fontFamily, marginBottom: DesignSpacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: DesignSpacing.sm },
  chip: {
    height: 38, paddingHorizontal: 14, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.borderMedium,
  },
  chipOn: { backgroundColor: DesignColors.primary, borderColor: DesignColors.primary },
  chipText: { ...DesignTypography.labelLg, color: DesignColors.onSurfaceVariant, fontFamily },
  chipTextOn: { color: DesignColors.onPrimary, fontWeight: '700' },
  done: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primary, marginTop: DesignSpacing.sm },
  doneText: { ...DesignTypography.labelLg, color: DesignColors.onPrimary, fontFamily, fontWeight: '800' },
});
