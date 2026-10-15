import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

export function useOverflowMenuAnimation(visible: boolean, onClose: () => void) {
  const [isMounted, setIsMounted] = useState(visible);
  const isClosingRef = useRef(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    isClosingRef.current = false;
    opacity.setValue(0);
    scale.setValue(0.85);
    translateY.setValue(14);
    backdropOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, opacity, scale, translateY]);

  const animateOut = useCallback(
    (afterClose?: () => void) => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 8,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isClosingRef.current = false;
        setIsMounted(false);
        onClose();
        afterClose?.();
      });
    },
    [backdropOpacity, opacity, scale, translateY, onClose],
  );

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      animateIn();
    } else if (isMounted && !isClosingRef.current) {
      animateOut();
    }
  }, [visible, isMounted, animateIn, animateOut]);

  return {
    isMounted,
    opacity,
    scale,
    translateY,
    backdropOpacity,
    animateOut,
  };
}
