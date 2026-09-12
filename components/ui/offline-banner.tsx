import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function OfflineBanner() {
  const { isOnline } = useAuth();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isVisible = useRef(false);

  useEffect(() => {
    if (!isOnline && !isVisible.current) {
      isVisible.current = true;
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 260, mass: 0.9, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else if (isOnline && isVisible.current) {
      isVisible.current = false;
      Animated.parallel([
        Animated.timing(translateY, { toValue: 80, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [isOnline, translateY, opacity]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, DesignSpacing.sm) + 68,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.banner}>
        <View style={styles.iconWrap}>
          <Ionicons name="cloud-offline-outline" size={18} color={DesignColors.onSurface} />
        </View>
        <Text style={styles.text}>You&apos;re offline</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: DesignSpacing.md,
    right: DesignSpacing.md,
    zIndex: 99998,
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingVertical: 12,
    paddingHorizontal: DesignSpacing.md,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.glassBorder,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  text: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurface,
    fontFamily,
  },
});
