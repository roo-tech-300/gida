import React from 'react';
import { StyleSheet, View } from 'react-native';

import { DesignColors, DesignRadius } from '@/constants/design';

type Props = {
  total: number;
  activeIndex: number;
};

export function TourPaginationDots({ total, activeIndex }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === activeIndex;
        return (
          <View
            key={`dot-${index}`}
            style={[styles.dot, isActive ? styles.dotActive : styles.dotInactive]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    height: 6,
    borderRadius: DesignRadius.full,
  },
  dotActive: {
    width: 22,
    backgroundColor: DesignColors.primaryBright,
  },
  dotInactive: {
    width: 6,
    backgroundColor: DesignColors.borderSoft,
  },
});
