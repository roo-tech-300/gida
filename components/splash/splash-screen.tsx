import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { DesignColors } from '@/constants/design';

function useDriftAnimation() {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(x, { toValue: 25, duration: 5000, useNativeDriver: true }),
          Animated.timing(y, { toValue: -15, duration: 5000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(x, { toValue: -15, duration: 5000, useNativeDriver: true }),
          Animated.timing(y, { toValue: 20, duration: 5000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(x, { toValue: -10, duration: 5000, useNativeDriver: true }),
          Animated.timing(y, { toValue: -10, duration: 5000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(x, { toValue: 0, duration: 5000, useNativeDriver: true }),
          Animated.timing(y, { toValue: 5, duration: 5000, useNativeDriver: true }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return { x, y };
}

export function SplashScreen() {
  const topRight = useDriftAnimation();
  const bottomLeft = useDriftAnimation();

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.bubbleTopRight,
          { transform: [{ translateX: topRight.x }, { translateY: topRight.y }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.bubbleBottomLeft,
          { transform: [{ translateX: bottomLeft.x }, { translateY: bottomLeft.y }] },
        ]}
        pointerEvents="none"
      />
      <View style={styles.logoWrapper}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(54, 71, 54, 0.15)',
    filter: 'blur(120px)',
    zIndex: 0,
  },
  bubbleBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(74, 225, 118, 0.05)',
    filter: 'blur(120px)',
    zIndex: 0,
  },
  logoWrapper: {
    zIndex: 1,
  },
  logo: {
    width: 120,
    height: 120,
  },
});
