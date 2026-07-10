import { StyleSheet, View } from 'react-native';

import { DesignColors } from '@/constants/design';

export function FeedDragHandle() {
  return (
    <View style={styles.container}>
      <View style={styles.pill} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  pill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
