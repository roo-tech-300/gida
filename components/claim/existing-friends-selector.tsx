import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { ChoiceChipRow } from '@/components/claim/choice-chip-row';
import { SlotDiagram } from '@/components/claim/slot-diagram';

type Props = {
  roommateCount: number;
  value: number;
  onChange: (have: number) => void;
};

export function ExistingFriendsSelector({ roommateCount, value, onChange }: Props) {
  const labels = Array.from({ length: roommateCount + 1 }, (_, index) => {
    if (index === 0) return 'None yet';
    return `${index} friend${index === 1 ? '' : 's'}`;
  });
  const matched = roommateCount - value;

  return (
    <View style={styles.container}>
      <ChoiceChipRow labels={labels} value={value} onChange={onChange} />
      <Text style={styles.summary}>
        {matched === 0
          ? 'All your roommates are friends. Gida keeps the group to just you and them.'
          : `Gida will go and look for ${matched} roommate${matched === 1 ? '' : 's'} for you.`}
      </Text>
      <SlotDiagram friendsCount={value} codeCount={0} matchedCount={matched} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: DesignSpacing.sm },
  summary: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
