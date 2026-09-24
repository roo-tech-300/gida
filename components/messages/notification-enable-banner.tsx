import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useNotificationPermission } from '@/src/use-notification-permission-platform';
import { useAppToast } from '@/components/ui/toast-card';

const BANNER_DISMISS_KEY = 'gida.notificationBannerDismissed';

function isBannerDismissed(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(BANNER_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function persistBannerDismissed(): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(BANNER_DISMISS_KEY, '1');
  } catch {
    // Best-effort: hiding for this session is enough.
  }
}

export function NotificationEnableBanner() {
  const { status, enable } = useNotificationPermission();
  const { showToast } = useAppToast();
  const [dismissed, setDismissed] = useState(isBannerDismissed);

  if (status === 'unavailable' || status === 'granted' || dismissed) return null;

  const handleEnable = async () => {
    const result = await enable();
    if (result.enabled) {
      persistBannerDismissed();
      setDismissed(true);
      showToast({ type: 'success', message: 'Notifications are on.' });
      return;
    }
    if (result.status === 'denied') {
      showToast({ type: 'info', message: 'Turn on notifications in your device settings.' });
    }
  };

  return (
    <View style={styles.banner}>
      <View style={styles.copy}>
        <Text style={styles.title}>Get notified when someone replies</Text>
        <Text style={styles.body}>Turn on notifications so you don’t miss new messages.</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => void handleEnable()}
          style={({ pressed }) => [styles.enableButton, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.enableLabel}>Enable</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            persistBannerDismissed();
            setDismissed(true);
          }}
          style={({ pressed }) => [styles.dismissButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification prompt"
        >
          <Ionicons name="close" size={18} color={DesignColors.onSurfaceVariant} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: DesignSpacing.marginMobile,
    marginBottom: DesignSpacing.sm,
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  body: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.xs,
  },
  enableButton: {
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    borderRadius: 999,
    backgroundColor: DesignColors.primary,
  },
  enableLabel: {
    ...DesignTypography.labelLg,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
  dismissButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
