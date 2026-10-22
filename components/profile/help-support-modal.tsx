import { Ionicons } from '@expo/vector-icons';
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP_CHANNEL_URL, SUPPORT_WHATSAPP_URL } from '@/constants/support';

type HelpSupportModalProps = {
  visible: boolean;
  onClose: () => void;
};

type SupportOption = {
  label: string;
  detail: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const SUPPORT_OPTIONS: SupportOption[] = [
  { label: 'WhatsApp', detail: SUPPORT_PHONE, href: SUPPORT_WHATSAPP_URL, icon: 'logo-whatsapp', color: '#25D366' },
  { label: 'WhatsApp Channel', detail: 'Community & announcements', href: SUPPORT_WHATSAPP_CHANNEL_URL, icon: 'megaphone', color: '#25D366' },
  { label: 'Email', detail: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}`, icon: 'mail-outline', color: DesignColors.primaryBright },
  { label: 'Call Support', detail: SUPPORT_PHONE, href: `tel:${SUPPORT_PHONE.replace(/\D/g, '')}`, icon: 'call-outline', color: DesignColors.primaryBright },
];

export function HelpSupportModal({ visible, onClose }: HelpSupportModalProps) {
  if (!visible) return null;
  return <HelpSupportContent onClose={onClose} />;
}

function HelpSupportContent({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const openLink = (href: string) => {
    Linking.openURL(href).catch((error) => {
      console.error('[HelpSupportModal] Failed to open support link:', error);
    });
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.outsideOverlay} onPress={onClose} />
        <SafeAreaView style={styles.dialogWrap}>
          <View style={styles.dialog}>
            <Text style={styles.title}>Help & Support</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close help and support"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
              onPress={onClose}>
              <Ionicons name="close" size={20} color={DesignColors.onSurfaceVariant} />
            </Pressable>

            <Text style={styles.subtitle}>Talk to the Gida team, we&apos;re here to help.</Text>

            <View style={styles.options}>
              {SUPPORT_OPTIONS.map((option) => (
                <Pressable
                  key={option.label}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label}: ${option.detail}`}
                  style={styles.option}
                  onPress={() => openLink(option.href)}>
                  <View style={styles.optionIconBox}>
                    <Ionicons name={option.icon} size={22} color={option.color} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionDetail}>{option.detail}</Text>
                  </View>
                  <Ionicons name="open-outline" size={18} color={DesignColors.outlineVariant} />
                </Pressable>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: DesignColors.scrimHeavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outsideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialogWrap: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: DesignSpacing.marginMobile,
  },
  dialog: {
    backgroundColor: DesignColors.surfaceContainerLowest,
    borderRadius: DesignRadius.xl,
    padding: DesignSpacing.md,
    gap: DesignSpacing.sm,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  closeBtn: {
    position: 'absolute',
    top: DesignSpacing.xs,
    right: DesignSpacing.xs,
    padding: DesignSpacing.xs,
    zIndex: 1,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.textPrimary,
    fontFamily,
    paddingRight: DesignSpacing.xl,
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  options: {
    gap: DesignSpacing.sm,
    marginTop: DesignSpacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.marginMobile,
    minHeight: 56,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  optionIconBox: {
    width: 40,
    height: 40,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
  },
  optionDetail: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});