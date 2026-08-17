import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { ChoiceChipRow } from '@/components/claim/choice-chip-row';
import { SlotDiagram } from '@/components/claim/slot-diagram';

type Props = {
  capacity: number;
  value: number;
  onChange: (roommates: number) => void;
};

export function GroupSizeSelector({ capacity, value, onChange }: Props) {
  const labels = Array.from({ length: capacity - 1 }, (_, index) => {
    const count = index + 1;
    return `${count} roommate${count === 1 ? '' : 's'}`;
  });

  return (
    <View style={styles.container}>
      <ChoiceChipRow labels={labels} value={value - 1} onChange={(index) => onChange(index + 1)} />
      <Text style={styles.total}>{value + 1} people in this group</Text>
      <SlotDiagram friendsCount={0} codeCount={0} matchedCount={value} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: DesignSpacing.sm },
  total: {
    ...DesignTypography.bodyMd,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '600',
  },
});
