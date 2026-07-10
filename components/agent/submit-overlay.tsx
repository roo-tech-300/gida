import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function SubmitOverlay({ visible }: { visible: boolean }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name="checkmark" size={36} color={DesignColors.onPrimary} />
      </Animated.View>
      <Text style={styles.title}>Welcome to the Workspace!</Text>
      <Text style={styles.sub}>Redirecting to your Agent Portfolio...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14, 14, 16, 0.95)', alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm, zIndex: 100 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  title: { ...DesignTypography.headlineMd, color: '#ffffff', fontFamily, marginTop: DesignSpacing.sm },
  sub: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
});
