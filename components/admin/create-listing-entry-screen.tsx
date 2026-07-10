import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';

export function CreateListingEntryScreen() {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const floatRotate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['6deg', '4deg'],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <BackButton hasBackground={false} />
      </View>

      <View style={styles.bgGlows}>
        <View style={styles.glowTopRight} />
        <View style={styles.glowBottomLeft} />
      </View>

      <View style={styles.body}>
        <Animated.View
          style={[
            styles.anchor,
            { transform: [{ translateY: floatTranslate }, { rotate: floatRotate }] },
          ]}
        >
          <View style={styles.mainCard}>
            <BlurView intensity={25} tint="dark" style={styles.cardBlur} />
            <Ionicons name="business-outline" size={64} color={DesignColors.primary} style={styles.mainIcon} />
          </View>

          <View style={styles.accentTopRight}>
            <BlurView intensity={25} tint="dark" style={styles.cardBlur} />
            <Ionicons name="location-outline" size={28} color={DesignColors.secondary} />
          </View>

          <View style={styles.accentBottomLeft}>
            <BlurView intensity={25} tint="dark" style={styles.cardBlur} />
            <Ionicons name="camera-outline" size={24} color={DesignColors.tertiary} />
          </View>
        </Animated.View>

        <View style={styles.textSection}>
          <Text style={styles.title}>Create Your Gida Listing</Text>
          <Text style={styles.description}>
            Onboard your lodge, apartment, or studio space into Gida's premium network.
            Provide core utilities, pinpoint precise satellite GPS coordinates on-site,
            and upload rich media galleries directly to Minna campus students.
          </Text>
        </View>

        <Pressable style={styles.cta} onPress={() => router.push('/admin/create-listing-core-specs')}>
          <Text style={styles.ctaText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={DesignColors.onSurface} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0e0e10' },
  topBar: { paddingHorizontal: 20, paddingVertical: 8, zIndex: 20 },
  bgGlows: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', pointerEvents: 'none' },
  glowTopRight: {
    position: 'absolute', top: '25%', right: -80, width: 256, height: 256,
    borderRadius: 128, backgroundColor: 'rgba(79,70,229,0.08)',
  },
  glowBottomLeft: {
    position: 'absolute', bottom: '25%', left: -80, width: 256, height: 256,
    borderRadius: 128, backgroundColor: 'rgba(0,165,114,0.04)',
  },
  body: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingBottom: 60,
  },
  anchor: {
    position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 32,
  },
  mainCard: {
    width: 192, height: 192, borderRadius: 40, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: DesignColors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 40, elevation: 10,
  },
  cardBlur: { ...StyleSheet.absoluteFillObject },
  mainIcon: { marginTop: 4 },
  accentTopRight: {
    position: 'absolute', top: -16, right: -16, zIndex: 20,
    width: 64, height: 64, borderRadius: 16, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(78,222,163,0.2)',
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  accentBottomLeft: {
    position: 'absolute', bottom: -24, left: -24, zIndex: 20,
    width: 56, height: 56, borderRadius: 28, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,182,149,0.2)',
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  textSection: { alignItems: 'center', gap: 12, maxWidth: 320, zIndex: 10 },
  title: { ...DesignTypography.headlineMd, fontSize: 24, color: DesignColors.onSurface, fontFamily, textAlign: 'center' },
  description: {
    ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily,
    textAlign: 'center', lineHeight: 22,
  },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 48, width: '100%', maxWidth: 320, zIndex: 10,
    backgroundColor: DesignColors.primaryContainer, paddingVertical: 16,
    borderRadius: 9999,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
});
