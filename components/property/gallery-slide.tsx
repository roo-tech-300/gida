import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { DesignColors } from '@/constants/design';

type Props = {
  uri: string;
  isZoomed: boolean;
  onZoomChange: (zoomed: boolean) => void;
};

export function GallerySlide({ uri, isZoomed, onZoomChange }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);
  const startScale = useSharedValue(1);

  useEffect(() => {
    if (loaded) return;
    const timer = setTimeout(() => setShowSpinner(true), 150);
    return () => clearTimeout(timer);
  }, [loaded]);

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onBegin(() => {
          startScale.value = scale.value;
        })
        .onUpdate((event) => {
          scale.value = Math.min(Math.max(startScale.value * event.scale, 1), 3);
          if (scale.value > 1.03) runOnJS(onZoomChange)(true);
        })
        .onEnd(() => {
          if (scale.value < 1.03) {
            scale.value = withSpring(1);
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            runOnJS(onZoomChange)(false);
          }
        }),
    [onZoomChange, scale, startScale, translateX, translateY],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isZoomed)
        .activeOffsetX([-12, 12])
        .activeOffsetY([-12, 12])
        .onBegin(() => {
          startTranslateX.value = translateX.value;
          startTranslateY.value = translateY.value;
        })
        .onUpdate((event) => {
          if (scale.value <= 1.03) return;
          translateX.value = startTranslateX.value + event.translationX;
          translateY.value = startTranslateY.value + event.translationY;
        })
        .onEnd(() => {
          if (scale.value <= 1.03) return;
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
        }),
    [isZoomed, scale, startTranslateX, startTranslateY, translateX, translateY],
  );

  const gesture = useMemo(() => (isZoomed ? Gesture.Simultaneous(pinchGesture, panGesture) : pinchGesture), [isZoomed, panGesture, pinchGesture]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.slide}>
        <Animated.View style={[styles.imageFrame, animatedStyle]}>
          <Image
            source={{ uri }}
            style={[styles.image, { opacity: loaded ? 1 : 0 }]}
            contentFit="contain"
            cachePolicy="disk"
            transition={300}
            onLoadEnd={() => setLoaded(true)}
          />
        </Animated.View>
        {showSpinner && !loaded && <ActivityIndicator size="large" color={DesignColors.primary} />}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  imageFrame: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
