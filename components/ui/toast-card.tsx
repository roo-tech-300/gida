import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions, Pressable, SafeAreaView } from 'react-native';
import { WebBlurView } from '@/components/ui/web-blur-view';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
export interface ToastData {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (config: { title?: string; message: string; type: 'success' | 'error' | 'info' }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_DURATION = 4000;

// ==========================================
// 2. ANIMATED TOAST CARD (INTERNAL COMPONENT)
// ==========================================
function ToastCard({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current;

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -32, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => onDismiss(toast.id));
  }, [onDismiss, toast.id, translateY, opacity]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 260, mass: 0.9, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();

    Animated.timing(progress, { toValue: 0, duration: TOAST_DURATION, useNativeDriver: true }).start();

    const timer = setTimeout(handleDismiss, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [handleDismiss, translateY, opacity, progress]);

  const themes = {
    success: { accent: DesignColors.success, icon: 'checkmark-circle', label: 'Success' },
    error: { accent: DesignColors.danger, icon: 'alert-circle', label: 'Error' },
    info: { accent: DesignColors.info, icon: 'information-circle', label: 'Heads up' },
  } as const;

  const theme = themes[toast.type];
  const title = toast.title ?? theme.label;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateY }], opacity }]}>
      <Pressable onPress={handleDismiss} style={styles.card} focusable={false} accessible={false}>
        <WebBlurView intensity={28} tint="dark" style={styles.blur} />
        <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />
        <View style={[styles.iconWrap, { backgroundColor: theme.accent }]}>
          <Ionicons name={theme.icon} size={18} color={DesignColors.surfaceContainerLowest} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
        </View>
        <Ionicons name="close" size={18} color={DesignColors.outline} />
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressBar, { backgroundColor: theme.accent, transform: [{ scaleX: progress }] }]}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ==========================================
// 3. GLOBAL CONTEXT PROVIDER
// ==========================================
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback(({ title, message, type }: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <SafeAreaView style={styles.globalContainer} pointerEvents="box-none">
          <View style={styles.toastStack} pointerEvents="box-none">
            {toasts.map((toast) => (
              <ToastCard key={toast.id} toast={toast} onDismiss={removeToast} />
            ))}
          </View>
        </SafeAreaView>
      )}
    </ToastContext.Provider>
  );
}

// ==========================================
// 4. EXPORTED HOOK FOR CONSUMPTION
// ==========================================
export function useAppToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useAppToast must be used within a ToastProvider');
  return context;
}

// ==========================================
// 5. COMPONENT STYLING
// ==========================================
const styles = StyleSheet.create({
  globalContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 99999,
  },
  toastStack: {
    alignItems: 'center',
    width: '100%',
  },
  wrapper: {
    width: Dimensions.get('window').width,
    paddingHorizontal: DesignSpacing.md,
    marginTop: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: DesignColors.glassBorder,
    backgroundColor: DesignColors.glassFill,
    paddingVertical: 14,
    paddingHorizontal: DesignSpacing.md,
    shadowColor: DesignColors.surfaceContainerLowest,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignSpacing.md,
  },
  textContainer: { flex: 1, paddingRight: DesignSpacing.sm },
  title: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  message: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    lineHeight: 18,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    overflow: 'hidden',
  },
  progressBar: {
    width: '100%',
    height: '100%',
    transformOrigin: 'left',
  },
});
