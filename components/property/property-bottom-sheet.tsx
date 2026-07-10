import { useRef } from 'react';
import { Animated, PanResponder, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignColors, DesignRadius, DesignSpacing } from '@/constants/design';

export function PropertyBottomSheet({
  children,
  heroHeight,
}: {
  children: React.ReactNode;
  heroHeight: number;
}) {
  const insets = useSafeAreaInsets();
  const headroom = insets.top + 64;
  const translateY = useRef(new Animated.Value(heroHeight)).current;
  const isExpanded = useRef(false);
  const startY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) < Math.abs(gesture.dy),
      onPanResponderGrant: () => {
        startY.current = (translateY as any).__getValue();
      },
      onPanResponderMove: (_, gesture) => {
        const next = startY.current + gesture.dy;
        translateY.setValue(Math.max(headroom, Math.min(heroHeight, next)));
      },
      onPanResponderRelease: (_, gesture) => {
        const currentY = startY.current + gesture.dy;
        if (gesture.vy < -0.3 || currentY < heroHeight * 0.4) {
          isExpanded.current = true;
          Animated.spring(translateY, {
            toValue: headroom,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        } else {
          isExpanded.current = false;
          Animated.spring(translateY, {
            toValue: heroHeight,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[
        styles.sheet,
        { transform: [{ translateY }] },
      ]}
    >
      <View {...panResponder.panHandlers} style={styles.handleArea}>
        <View style={styles.handle} />
      </View>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: DesignColors.surface,
    overflow: 'hidden',
  },
  handleArea: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.surface,
    zIndex: 10,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.outlineVariant,
  },
  scrollContent: {
    padding: DesignSpacing.marginMobile,
    paddingBottom: 140,
  },
});
