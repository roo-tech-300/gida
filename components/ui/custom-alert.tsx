import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  DesignColors,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';

type AlertButton = {
  label: string;
  onPress?: () => void;
  style?: 'primary' | 'destructive' | 'cancel';
};

type CustomAlertProps = {
  visible: boolean;
  title?: string;
  message: string;
  buttons: AlertButton[];
  onDismiss: () => void;
};

export function CustomAlert({ visible, title, message, buttons, onDismiss }: CustomAlertProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 100, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.92, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacity, scale]);

  const handleButtonPress = (btn: AlertButton) => {
    btn.onPress?.();
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <Pressable onPress={() => {}}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            <Text style={styles.message}>{message}</Text>
            <View style={styles.buttonRow}>
              {buttons.map((btn, i) => (
                <Pressable
                  key={i}
                  style={[styles.button, getButtonBg(btn.style), buttons.length === 1 && styles.buttonFull]}
                  onPress={() => handleButtonPress(btn)}
                  hitSlop={{ top: 8, bottom: 8 }}
                >
                  <Text style={[styles.buttonText, getButtonTextStyle(btn.style)]}>
                    {btn.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

type AlertState = {
  visible: boolean;
  title?: string;
  message: string;
  buttons: AlertButton[];
};

const EMPTY_STATE: AlertState = { visible: false, title: '', message: '', buttons: [] };

export function useCustomAlert() {
  const [state, setState] = useState<AlertState>(EMPTY_STATE);

  const showAlert = useCallback(
    ({ title, message, buttons }: Omit<AlertState, 'visible'>) => {
      setState({ visible: true, title, message, buttons });
    },
    [],
  );

  const hideAlert = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  return { ...state, showAlert, hideAlert };
}

function getButtonBg(style?: string) {
  switch (style) {
    case 'primary':
      return styles.buttonPrimary;
    case 'destructive':
      return styles.buttonDestructive;
    default:
      return styles.buttonCancel;
  }
}

function getButtonTextStyle(style?: string) {
  switch (style) {
    case 'primary':
      return styles.textPrimary;
    case 'destructive':
      return styles.textDestructive;
    default:
      return styles.textCancel;
  }
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSpacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.lg,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    marginBottom: DesignSpacing.sm,
  },
  message: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 22,
    marginBottom: DesignSpacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DesignRadius.md,
    paddingVertical: 13,
  },
  buttonFull: {
    flex: undefined,
    width: '100%',
  },
  buttonPrimary: {
    backgroundColor: DesignColors.primaryContainer,
  },
  buttonDestructive: {
    backgroundColor: DesignColors.errorContainer,
  },
  buttonCancel: {
    backgroundColor: DesignColors.surfaceContainerHighest,
  },
  buttonText: {
    ...DesignTypography.bodyMd,
    fontFamily,
    fontWeight: '600',
  },
  textPrimary: {
    color: DesignColors.textPrimary,
  },
  textDestructive: {
    color: DesignColors.onErrorContainer,
  },
  textCancel: {
    color: DesignColors.onSurfaceVariant,
  },
});
