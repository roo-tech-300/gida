import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions, Pressable, SafeAreaView } from 'react-native';
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

// ==========================================
// 2. ANIMATED TOAST CARD (INTERNAL COMPONENT)
// ==========================================
function ToastCard({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth slide down & fade in
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss safety timer (4 seconds)
    const timer = setTimeout(() => handleDismiss(), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -40, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss(toast.id));
  };

  const themes = {
    success: { bg: '#E6F4EA', border: DesignColors.primary || '#0F9D58', text: '#137333', icon: '✓' },
    error: { bg: '#FCE8E6', border: '#D93025', text: '#C5221F', icon: '✕' },
    info: { bg: '#E8F0FE', border: DesignColors.primaryBright || '#1A73E8', text: '#1C3AA9', icon: 'ℹ' },
  };

  const currentTheme = themes[toast.type];

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateY }], opacity }]}>
      <Pressable onPress={handleDismiss} style={[styles.card, { backgroundColor: currentTheme.bg, borderColor: currentTheme.border }]}>
        <View style={[styles.badge, { backgroundColor: currentTheme.border }]}>
          <Text style={styles.badgeText}>{currentTheme.icon}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: currentTheme.text }]}>
            {toast.title || (toast.type.charAt(0).toUpperCase() + toast.type.slice(1))}
          </Text>
          <Text style={[styles.message, { color: currentTheme.text }]}>{toast.message}</Text>
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
    borderWidth: 1,
    borderRadius: DesignRadius.lg,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  textContainer: { flex: 1 },
  title: { ...DesignTypography.bodyMd, fontWeight: '700', fontFamily, marginBottom: 2 },
  message: { ...DesignTypography.bodyMd, fontFamily, opacity: 0.9, lineHeight: 16 },
});