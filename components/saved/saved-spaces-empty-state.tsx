import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiscoverBottomNav } from '@/components/home/discover-bottom-nav';
import { FloatingBadge } from '@/components/ui/floating-badge';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function SavedSpacesEmptyState() {
  const router = useRouter();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const mainTranslateY = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -15, 0],
  });

  const mainRotate = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['6deg', '4deg', '6deg'],
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1300);
  }, []);

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DesignColors.primary} />
        }
      >
        <View style={styles.center}>
          <View style={styles.iconArea}>
            <Animated.View
              style={[
                styles.mainCard,
                {
                  transform: [{ translateY: mainTranslateY }, { rotate: mainRotate }],
                },
              ]}
            >
              <Ionicons name="heart" size={52} color={DesignColors.primary} />

              <FloatingBadge
                icon="home"
                size={18}
                top={-8}
                right={-8}
                rotate="-12deg"
                color={DesignColors.secondary}
                shape="rounded"
              />

              <FloatingBadge
                icon="bookmark"
                size={16}
                bottom={-4}
                left={-14}
                rotate="12deg"
                color={DesignColors.tertiary}
                shape="circle"
                delay={600}
              />
            </Animated.View>
          </View>

          <Text style={styles.title}>Your Shortlist is Empty</Text>
          <Text style={styles.subtitle}>
            Tap the heart icon on any premium penthouse, flat, or student lodge to save your top choices here for
            quick comparison.
          </Text>

          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.button}>
            <Text style={styles.buttonText}>Find Your Next Space</Text>
            <Ionicons name="arrow-forward" size={18} color={DesignColors.onPrimary} />
          </Pressable>
        </View>
      </ScrollView>

      <DiscoverBottomNav activeTab="saved" />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  scroll: {
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignSpacing.marginMobile,
    gap: DesignSpacing.md,
  },
  iconArea: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSpacing.sm,
  },
  mainCard: {
    width: 144,
    height: 144,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27, 27, 29, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: DesignColors.primary,
    marginTop: DesignSpacing.sm,
  },
  buttonText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
});
