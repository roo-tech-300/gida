import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';

/** Small caps heading for a section of the property page, with an optional action on the right. */
export function SectionLabel({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label} accessibilityRole="header">{children}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: DesignSpacing.sm + 4 },
  label: { fontFamily, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: DesignColors.outline },
});
