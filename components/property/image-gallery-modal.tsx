import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignColors, fontFamily } from '@/constants/design';

type Props = {
  photos: string[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
};

type SlideProps = { uri: string; isZoomed: boolean; onZoomChange: (zoomed: boolean) => void };

function GallerySlide({ uri, isZoomed, onZoomChange }: SlideProps) {
  const [loaded, setLoaded] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);

  useEffect(() => {
    if (loaded) return;
    const timer = setTimeout(() => setShowSpinner(true), 150);
    return () => clearTimeout(timer);
  }, [loaded]);
  const startScale = useSharedValue(1);

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

export function ImageGalleryModal({ photos, initialIndex, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const listRef = useRef<FlatList<string>>(null);
  const validInitialIndex = Math.min(Math.max(initialIndex, 0), Math.max(photos.length - 1, 0));

  useEffect(() => {
    if (!visible || photos.length === 0) return;

    setCurrentIndex(validInitialIndex);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: validInitialIndex, animated: false });
    });
  }, [photos.length, validInitialIndex, visible]);

  const handleMomentumEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number }; layoutMeasurement: { width: number } } }) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
      setCurrentIndex(idx);
    },
    [],
  );

  const handleScrollToIndexFailed = useCallback((info: { index: number; averageItemLength: number }) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: false,
      });
    });
  }, []);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.backdrop}>
          <FlatList
            ref={listRef}
            data={photos}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            bounces={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate="fast"
            scrollEnabled={!isZoomed}
            initialScrollIndex={validInitialIndex}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            onMomentumScrollEnd={handleMomentumEnd}
            onScrollToIndexFailed={handleScrollToIndexFailed}
            renderItem={({ item }) => (
              <View style={[styles.item, { width: screenWidth }]}>
                <GallerySlide uri={item} isZoomed={isZoomed} onZoomChange={setIsZoomed} />
              </View>
            )}
          />

          <View style={[styles.topBar, { top: insets.top }]}>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </Pressable>
            <Text style={styles.counter}>
              {currentIndex + 1} / {photos.length}
            </Text>
            <View style={styles.actionGhost} />
          </View>

          <View style={styles.hintWrap} pointerEvents="none">
            <Text style={styles.hintText}>Pinch to zoom</Text>
          </View>

          <View style={[styles.bottomBadge, { bottom: Math.max(insets.bottom + 16, 24) }]}>
            <Text style={styles.bottomBadgeText}>
              {currentIndex + 1} of {photos.length}
            </Text>
            <View style={styles.dotsRow}>
              {photos.map((_, index) => (
                <View key={index} style={[styles.dot, index === currentIndex && styles.dotActive]} />
              ))}
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  backdrop: { flex: 1, backgroundColor: '#000000' },
  item: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  imageFrame: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    color: '#ffffff',
    fontFamily,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  actionGhost: { width: 40 },
  hintWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 84,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily,
  },
  bottomBadge: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 10,
  },
  bottomBadgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 24,
    backgroundColor: DesignColors.primary,
  },
});
