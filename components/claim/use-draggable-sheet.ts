import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, useWindowDimensions } from 'react-native';

const COLLAPSED_RATIO = 0.52;
const EXPANDED_RATIO = 0.92;
const SPRING = { damping: 24, stiffness: 240, useNativeDriver: false };

export function useDraggableSheet() {
  const { height: screenHeight } = useWindowDimensions();
  const collapsed = Math.round(screenHeight * COLLAPSED_RATIO);
  const expanded = Math.round(screenHeight * EXPANDED_RATIO);

  const [height] = useState(() => new Animated.Value(expanded));
  const startY = useRef(0);
  const currentHeight = useRef(expanded);

  // Animated.Value has no public getter, so mirror its value through a listener.
  useEffect(() => {
    const id = height.addListener(({ value }) => {
      currentHeight.current = value;
    });
    return () => height.removeListener(id);
  }, [height]);

  // eslint-disable-next-line react-hooks/refs -- the callbacks only read refs inside gesture events, never during render
  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderGrant: () => {
        startY.current = currentHeight.current;
      },
      onPanResponderMove: (_, gesture) => {
        const next = startY.current - gesture.dy;
        height.setValue(Math.max(collapsed, Math.min(expanded, next)));
      },
      onPanResponderRelease: (_, gesture) => {
        const currentHeight = startY.current - gesture.dy;
        const midpoint = (collapsed + expanded) / 2;
        const shouldExpand = gesture.vy < -0.3 || currentHeight > midpoint;
        Animated.spring(height, { toValue: shouldExpand ? expanded : collapsed, ...SPRING }).start();
      },
    }),
  );

  return { panHandlers: panResponder.panHandlers, sheetHeight: height };
}
