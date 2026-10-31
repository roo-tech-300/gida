import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { FloatingBadge } from '@/components/ui/floating-badge';
import {
  DesignColors,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';

type AnimatedErrorModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

/**
 * Bubbly, animated error overlay for dead ends that should not break the
 * current screen (e.g. a legacy message attachment missing its target id).
 * Reuses the floating-card language from NetworkErrorScreen / NoResultsFoundScreen.
 */
export function AnimatedErrorModal({
  visible,
  onClose,
  title,
  message,
  actionLabel = 'Got it',
  onAction,
  testID = 'animated-error-modal',
}: AnimatedErrorModalProps) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(0.85));
  const [shake] = useState(() => new Animated.Value(0));
  const [float] = useState(() => new Animated.Value(0));

  useEscapeKey(onClose, visible);

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.85);
      shake.setValue(0);
      float.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 180,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(140),
      Animated.timing(shake, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 70, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoop.start();

    return () => floatLoop.stop();
  }, [visible, opacity, scale, shake, float]);

  const floatTranslateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const floatRotate = float.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });
  const shakeTranslateX = shake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-10, 0, 10] });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close error message"
        />

        <Animated.View
          testID={testID}
          accessibilityRole="alert"
          style={[styles.card, { opacity, transform: [{ scale }, { translateX: shakeTranslateX }] }]}
        >
          <View style={styles.iconArea}>
            <Animated.View
              style={[styles.iconCard, { transform: [{ translateY: floatTranslateY }, { rotate: floatRotate }] }]}
            >
              <Ionicons name="alert-circle-outline" size={44} color={DesignColors.error} />
              <FloatingBadge
                icon="close"
                size={16}
                top={-8}
                right={-10}
                rotate="-12deg"
                color={DesignColors.error}
                shape="circle"
              />
              <FloatingBadge
                icon="help"
                size={16}
                bottom={-6}
                left={-12}
                rotate="12deg"
                color={DesignColors.secondary}
                shape="rounded"
                delay={500}
              />
            </Animated.View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={() => {
              onAction?.();
              onClose();
            }}
          >
            <Text style={styles.buttonText}>{actionLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSpacing.lg,
    backgroundColor: DesignColors.scrimHeavy,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerHigh,
    paddingHorizontal: DesignSpacing.lg,
    paddingTop: DesignSpacing.lg,
    paddingBottom: DesignSpacing.lg,
  },
  iconArea: {
    width: 132,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSpacing.sm,
  },
  iconCard: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: DesignColors.glassBorder,
    backgroundColor: DesignColors.glassFill,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: DesignSpacing.sm,
  },
  button: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryContainer,
    paddingVertical: 14,
    marginTop: DesignSpacing.lg,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
});
