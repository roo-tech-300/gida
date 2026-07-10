import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

export function FloatingBadge({
  icon,
  size,
  top,
  left,
  right,
  bottom,
  rotate,
  color,
  shape,
  delay = 0,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  size: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  rotate: string;
  color: string;
  shape: 'rounded' | 'circle';
  delay?: number;
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 4000,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim, delay]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -8, 0],
  });

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          top,
          left,
          right,
          bottom,
          borderRadius: shape === 'circle' ? 999 : 12,
          transform: [{ translateY }, { rotate }],
        },
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27, 27, 29, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});
