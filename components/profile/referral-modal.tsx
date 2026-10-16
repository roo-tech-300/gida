import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { copyTextToClipboard } from '@/utils/clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ReferralModalProps = {
  visible: boolean;
  onClose: () => void;
  link: string | null;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
};

export function ReferralModal({ visible, onClose, link, isLoading, hasError, onRetry }: ReferralModalProps) {
  if (!visible) return null;
  return <ReferralModalContent onClose={onClose} link={link} isLoading={isLoading} hasError={hasError} onRetry={onRetry} />;
}

function ReferralModalContent({ onClose, link, isLoading, hasError, onRetry }: Omit<ReferralModalProps, 'visible'>) {
  const { showToast } = useAppToast();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const copyLink = async () => {
    if (!link) return;
    try {
      const copied = await copyTextToClipboard(link);
      showToast({ message: copied ? 'Referral link copied' : 'Failed to copy link', type: copied ? 'success' : 'error' });
    } catch (error) {
      console.error('[Referral] Failed to copy link:', error);
      showToast({ message: 'Failed to copy link', type: 'error' });
    }
  };

  const shareLink = async () => {
    if (!link) return;
    try {
      await Share.share({ message: `Join me on Gida! ${link}` });
    } catch (error) {
      console.error('[Referral] Failed to share link:', error);
      showToast({ message: 'Failed to share link', type: 'error' });
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.outsideOverlay} onPress={onClose} />
        <SafeAreaView style={styles.dialogWrap}>
          <View style={styles.dialog}>
            <Pressable accessibilityRole="button" hitSlop={12} style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={DesignColors.onSurfaceVariant} />
            </Pressable>
            <Text style={styles.title}>Refer & Earn</Text>
            <Text style={styles.subtitle}>Share your link. When someone joins and pays for a lodge, you earn ₦2,000.</Text>
            {link ? (
              <View style={styles.linkBox}>
                <Text style={styles.linkText} numberOfLines={2}>{link}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Copy referral link" style={styles.copyBtn} onPress={copyLink}>
                  <Ionicons name="copy-outline" size={16} color={DesignColors.primaryBright} />
                </Pressable>
              </View>
            ) : isLoading ? (
              <ActivityIndicator color={DesignColors.primaryBright} />
            ) : null}
            {hasError && (
              <View style={styles.errorRow}>
                <Text style={styles.errorText}>Link could not be loaded.</Text>
                <Pressable accessibilityRole="button" onPress={onRetry}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            )}
            {link ? (
              <Pressable accessibilityRole="button" style={styles.shareBtn} onPress={shareLink}>
                <Ionicons name="share-social-outline" size={18} color={DesignColors.onPrimary} />
                <Text style={styles.shareText}>Share Link</Text>
              </Pressable>
            ) : null}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  outsideOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  dialogWrap: { width: '100%', maxWidth: 420, paddingHorizontal: DesignSpacing.marginMobile },
  dialog: { backgroundColor: DesignColors.surfaceContainerLowest, borderRadius: DesignRadius.xl, padding: DesignSpacing.md, gap: DesignSpacing.sm, borderWidth: 1, borderColor: DesignColors.borderSoft },
  closeBtn: { alignSelf: 'flex-end', padding: 4 },
  title: { ...DesignTypography.titleMd, color: DesignColors.onSurface, fontFamily },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  linkBox: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.xs, backgroundColor: DesignColors.surfaceContainerHigh, paddingHorizontal: DesignSpacing.md, paddingVertical: DesignSpacing.sm, borderRadius: DesignRadius.md },
  linkText: { ...DesignTypography.labelSm, color: DesignColors.onSurface, fontFamily, flex: 1 },
  copyBtn: { padding: 4 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm, backgroundColor: DesignColors.primary, borderRadius: DesignRadius.lg, paddingVertical: DesignSpacing.md },
  shareText: { ...DesignTypography.labelLg, color: DesignColors.onPrimary, fontFamily, fontWeight: '700' },
  errorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: DesignSpacing.sm },
  errorText: { ...DesignTypography.labelSm, color: DesignColors.error, fontFamily, flex: 1 },
  retryText: { ...DesignTypography.labelSm, color: DesignColors.primaryBright, fontFamily, fontWeight: '700' },
});
