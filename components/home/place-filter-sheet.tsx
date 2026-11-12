import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export interface FilterOption {
  key: string;
  label: string;
  selected: boolean;
}

type Props = {
  visible: boolean;
  title: string;
  options: FilterOption[];
  onSelect: (key: string | null) => void;
  onClose: () => void;
};

/** Bottom sheet with one choice per row. Closes on outside tap, Escape or the system back button. */
export function PlaceFilterSheet({ visible, title, options, onSelect, onClose }: Props) {
  useEscapeKey(onClose, visible);
  const nothingSelected = options.every((option) => !option.selected);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filter" testID="filter-sheet-backdrop">
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{title}</Text>
          <ScrollView bounces={false} style={styles.list}>
            <Row label="Any" selected={nothingSelected} onPress={() => onSelect(null)} />
            {options.map((option) => (
              <Row key={option.key} label={option.label} selected={option.selected} onPress={() => onSelect(option.key)} />
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Text style={[styles.rowText, selected && styles.rowTextOn]}>{label}</Text>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={DesignColors.primaryBright} /> : <View style={styles.radio} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: DesignColors.scrimHeavy },
  sheet: {
    maxHeight: '70%', paddingHorizontal: DesignSpacing.marginMobile, paddingBottom: DesignSpacing.xl, paddingTop: DesignSpacing.sm,
    borderTopLeftRadius: DesignRadius.xl, borderTopRightRadius: DesignRadius.xl, backgroundColor: DesignColors.surface,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: DesignColors.borderStrong, marginBottom: DesignSpacing.md },
  title: { ...DesignTypography.headlineMd, fontSize: 20, color: DesignColors.onSurface, fontFamily, fontWeight: '800', marginBottom: DesignSpacing.sm },
  list: { flexGrow: 0 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, borderBottomWidth: 1, borderBottomColor: DesignColors.borderFaint },
  rowText: { ...DesignTypography.bodyLg, color: DesignColors.onSurfaceVariant, fontFamily },
  rowTextOn: { color: DesignColors.onSurface, fontWeight: '700' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: DesignColors.outline },
});
