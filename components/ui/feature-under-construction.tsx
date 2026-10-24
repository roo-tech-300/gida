import { AppBottomNav, type BottomTab } from '@/components/navigation/app-bottom-nav';
import { FloatingBadge } from '@/components/ui/floating-badge';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

interface FeatureUnderConstructionProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  subtitle?: string;
  headerTitle?: string;
  onGoBack?: () => void;
  activeTab?: BottomTab;
}

export function FeatureUnderConstruction({
  icon = 'construct-outline',
  title = 'Feature Under Construction',
  subtitle,
  headerTitle,
  onGoBack,
  activeTab = 'home',
}: FeatureUnderConstructionProps) {
  const [floatAnim] = useState(() => new Animated.Value(0));

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

  const handleBack = useCallback(() => {
    onGoBack?.();
  }, [onGoBack]);

  return (
    <View style={styles.safe}>
      {onGoBack && (
        <View style={styles.topBar}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={DesignColors.onSurface} />
          </Pressable>
          {headerTitle ? <Text style={styles.topBarTitle}>{headerTitle}</Text> : null}
        </View>
      )}

      <View style={styles.center}>
        <View style={styles.iconArea}>
          <Animated.View
            style={[
              styles.mainCard,
              { transform: [{ translateY: mainTranslateY }, { rotate: mainRotate }] },
            ]}
          >
            <Ionicons name={icon} size={52} color={DesignColors.primary} />

            <FloatingBadge
              icon="construct-outline"
              size={18}
              top={-8}
              right={-8}
              rotate="-12deg"
              color={DesignColors.secondary}
              shape="rounded"
            />

            <FloatingBadge
              icon="hammer-outline"
              size={18}
              bottom={-4}
              left={-14}
              rotate="12deg"
              color={DesignColors.tertiary}
              shape="circle"
              delay={600}
            />
          </Animated.View>
        </View>

        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {onGoBack && (
          <Pressable onPress={handleBack} style={styles.button}>
            <Ionicons name="arrow-back" size={16} color={DesignColors.onPrimary} />
            <Text style={styles.buttonText}>Go Back</Text>
          </Pressable>
        )}
      </View>

      <AppBottomNav activeTab={activeTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
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
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.glassBorder,
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
    backgroundColor: DesignColors.primaryContainer,
    marginTop: DesignSpacing.sm,
  },
  buttonText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
});
