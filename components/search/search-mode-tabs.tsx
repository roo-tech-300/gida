import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export type SearchMode = 'listings' | 'roommates';

type Props = {
  active: SearchMode;
  onChange: (mode: SearchMode) => void;
};

export function SearchModeTabs({ active, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Tab label="Listings" isActive={active === 'listings'} onPress={() => onChange('listings')} />
      <Tab label="Roommates" isActive={active === 'roommates'} onPress={() => onChange('roommates')} />
    </View>
  );
}

function Tab({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, isActive && styles.tabActive]}>
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.surfaceContainer,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  tabActive: {
    backgroundColor: DesignColors.primaryContainer,
    borderColor: DesignColors.primaryBright,
  },
  tabText: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  tabTextActive: {
    color: DesignColors.onPrimary,
    fontWeight: '700',
  },
});
