import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DesignColors, DesignRadius, DesignTypography, fontFamily } from '@/constants/design';

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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: DesignRadius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    alignSelf: 'stretch',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: DesignColors.primary,
  },
  tabText: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    fontWeight: '600',
  },
  tabTextActive: {
    color: DesignColors.onPrimary,
    fontWeight: '700',
  },
});
