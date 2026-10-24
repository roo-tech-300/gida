import { StyleSheet, View } from 'react-native';

import { DesignColors, DesignSpacing } from '@/constants/design';

function CardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.thumb} />
      <View style={styles.body}>
        <View style={[styles.line, styles.short]} />
        <View style={[styles.line, styles.wide]} />
        <View style={[styles.line, styles.medium]} />
      </View>
    </View>
  );
}

export function DiscoverSkeleton() {
  return (
    <View style={styles.list}>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.md,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  thumb: {
    width: 92,
    height: 92,
    borderRadius: 14,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  short: {
    width: '32%',
  },
  wide: {
    width: '78%',
  },
  medium: {
    width: '54%',
  },
});
