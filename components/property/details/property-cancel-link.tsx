import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';

/** A quiet way out for a student whose spot is held but unpaid. */
export function PropertyCancelLink({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>Changed your mind?</Text>
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
        <Text style={styles.link}>Cancel request</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: DesignSpacing.md, paddingHorizontal: 4 },
  text: { fontFamily, fontSize: 13, color: DesignColors.outline },
  link: { fontFamily, fontSize: 13, fontWeight: '700', color: DesignColors.primaryFixed, textDecorationLine: 'underline' },
});
