import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DesignColors, fontFamily } from '@/constants/design';
import { type GalleryMedia, mediaKey } from '@/types/gallery-media';
import { GalleryBottomBadge, GalleryTopBar } from './gallery-chrome';
import { GallerySlide } from './gallery-slide';
import { GalleryVideoSlide } from './gallery-video-slide';

type Props = {
  media: GalleryMedia[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
};

function getSlideIndex(nativeEvent: {
  contentOffset: { x: number };
  layoutMeasurement: { width: number };
}): number {
  if (!nativeEvent.layoutMeasurement.width) return 0;
  const idx = Math.round(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width);
  return Math.max(0, idx);
}

export function ImageGalleryModal({ media, initialIndex, visible, onClose }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const listRef = useRef<FlatList<GalleryMedia>>(null);
  const backdropRef = useRef<View>(null);
  const validInitialIndex = Math.min(Math.max(initialIndex, 0), Math.max(media.length - 1, 0));

  const scrollToPrev = useCallback(() => {
    if (currentIndex <= 0) return;
    const next = currentIndex - 1;
    setCurrentIndex(next);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  }, [currentIndex]);

  const scrollToNext = useCallback(() => {
    if (currentIndex >= media.length - 1) return;
    const next = currentIndex + 1;
    setCurrentIndex(next);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  }, [currentIndex, media.length]);

  useEffect(() => {
    if (!visible || media.length === 0) return;
    setCurrentIndex(validInitialIndex);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: validInitialIndex, animated: false });
    });
  }, [media.length, validInitialIndex, visible]);

  // Keyboard navigation (web-friendly): left/right arrows, Escape to close.
  useEffect(() => {
    if (!visible) return;
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') scrollToPrev();
      else if (e.key === 'ArrowRight') scrollToNext();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose, scrollToPrev, scrollToNext]);

  // Mouse-wheel navigation (web): scroll up/left = prev, down/right = next.
  useEffect(() => {
    if (!visible) return;
    const node = backdropRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    let lastNav = 0;
    const onWheel = (e: WheelEvent) => {
      if (isZoomed) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 20) return;
      const now = Date.now();
      if (now - lastNav < 350) return;
      lastNav = now;
      if (delta > 0) scrollToNext();
      else scrollToPrev();
    };
    node.addEventListener('wheel', onWheel, { passive: true });
    return () => node.removeEventListener('wheel', onWheel);
  }, [visible, isZoomed, scrollToNext, scrollToPrev]);

  const handleMomentumEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number }; layoutMeasurement: { width: number } } }) => {
      setCurrentIndex(getSlideIndex(e.nativeEvent));
    },
    [],
  );

  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number }; layoutMeasurement: { width: number } } }) => {
      setCurrentIndex(getSlideIndex(e.nativeEvent));
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

  if (!visible || media.length === 0) return null;

  // Arrows are a web-only affordance: on mobile users swipe, and the buttons
  // would cover the photo. Desktop web has no drag-to-scroll, so they stay.
  const showNav = Platform.OS === 'web' && media.length > 1;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
        <View ref={backdropRef} style={styles.backdrop}>
          <FlatList
            ref={listRef}
            data={media}
            keyExtractor={mediaKey}
            extraData={currentIndex}
            horizontal
            pagingEnabled
            bounces={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate="fast"
            scrollEnabled={!isZoomed}
            initialScrollIndex={validInitialIndex}
            style={styles.list}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            onMomentumScrollEnd={handleMomentumEnd}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onScrollToIndexFailed={handleScrollToIndexFailed}
            renderItem={({ item, index }) => (
              <View style={[styles.item, { width: screenWidth, height: screenHeight }]}>
                {item.type === 'photo' ? (
                  <GallerySlide uri={item.uri} isZoomed={isZoomed} onZoomChange={setIsZoomed} />
                ) : (
                  <GalleryVideoSlide video={item.video} isActive={index === currentIndex} />
                )}
              </View>
            )}
          />

          <GalleryTopBar index={currentIndex} total={media.length} onClose={onClose} />

          <View style={styles.hintWrap} pointerEvents="none">
            <Text style={styles.hintText}>Pinch to zoom</Text>
          </View>

          {showNav && (
            <View style={styles.navWrap} pointerEvents="box-none">
              <Pressable style={styles.navBtn} onPress={scrollToPrev} disabled={currentIndex <= 0}>
                <Ionicons name="chevron-back-outline" size={32} color={DesignColors.onSurface} />
              </Pressable>
              <Pressable style={styles.navBtn} onPress={scrollToNext} disabled={currentIndex >= media.length - 1}>
                <Ionicons name="chevron-forward-outline" size={32} color={DesignColors.onSurface} />
              </Pressable>
            </View>
          )}

          <GalleryBottomBadge index={currentIndex} total={media.length} />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  backdrop: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  list: { flex: 1 },
  item: { flex: 1 },
  hintWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 84,
    alignItems: 'center',
  },
  hintText: {
    color: DesignColors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily,
  },
  navWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  navBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
