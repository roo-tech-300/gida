import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { DesignColors, DesignSpacing } from '@/constants/design';

function usePulse() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
}

function CardSkeleton({ opacity }: { opacity: Animated.AnimatedInterpolation<number> }) {
  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.thumb} />
      <View style={styles.body}>
        <View style={[styles.line, styles.short]} />
        <View style={[styles.line, styles.wide]} />
        <View style={[styles.line, styles.medium]} />
      </View>
    </Animated.View>
  );
}

export function DiscoverSkeleton() {
  const opacity = usePulse();

  return (
    <View style={styles.list}>
      <CardSkeleton opacity={opacity} />
      <CardSkeleton opacity={opacity} />
      <CardSkeleton opacity={opacity} />
      <CardSkeleton opacity={opacity} />
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
  short: { width: '32%' },
  wide: { width: '78%' },
  medium: { width: '54%' },
});
