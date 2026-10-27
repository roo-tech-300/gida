import { useRef } from 'react';
import { Animated, PanResponder, useWindowDimensions } from 'react-native';

const COLLAPSED_RATIO = 0.52;
const EXPANDED_RATIO = 0.92;
const SPRING = { damping: 24, stiffness: 240, useNativeDriver: false };

export function useDraggableSheet() {
  const { height: screenHeight } = useWindowDimensions();
  const collapsed = Math.round(screenHeight * COLLAPSED_RATIO);
  const expanded = Math.round(screenHeight * EXPANDED_RATIO);

  const heightRef = useRef(new Animated.Value(expanded));
  const height = heightRef.current;
  const startY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderGrant: () => {
        startY.current = (heightRef.current as unknown as { __getValue(): number }).__getValue();
      },
      onPanResponderMove: (_, gesture) => {
        const next = startY.current - gesture.dy;
        heightRef.current.setValue(Math.max(collapsed, Math.min(expanded, next)));
      },
      onPanResponderRelease: (_, gesture) => {
        const currentHeight = startY.current - gesture.dy;
        const midpoint = (collapsed + expanded) / 2;
        const shouldExpand = gesture.vy < -0.3 || currentHeight > midpoint;
        Animated.spring(heightRef.current, { toValue: shouldExpand ? expanded : collapsed, ...SPRING }).start();
      },
    }),
  ).current;

  return { panHandlers: panResponder.panHandlers, sheetHeight: height };
}
