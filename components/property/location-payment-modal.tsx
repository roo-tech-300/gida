import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  feeAmount?: number;
  propertyTitle?: string;
};

export function LocationPaymentModal({
  visible,
  onClose,
  onSuccess,
  feeAmount = 500,
  propertyTitle = 'Property Listing',
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        onClose();
      }
    };
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [visible, onClose]);

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="map" size={24} color={DesignColors.primary} />
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={DesignColors.onSurfaceVariant} />
            </Pressable>
          </View>

          <Text style={styles.title}>Unlock Exact Location</Text>
          <Text style={styles.subtitle}>
            Pay a small verification fee to view the exact GPS coordinates (Latitude & Longitude) and precise map pin for{' '}
            <Text style={styles.bold}>{propertyTitle}</Text>.
          </Text>

          <View style={styles.feeCard}>
            <Text style={styles.feeLabel}>LOCATION ACCESS FEE</Text>
            <Text style={styles.feeAmount}>₦{feeAmount.toLocaleString('en-US')}</Text>
          </View>

          <View style={styles.guaranteeRow}>
            <Ionicons name="shield-checkmark" size={16} color={DesignColors.secondary} />
            <Text style={styles.guaranteeText}>One-time fee per listing. Instant access.</Text>
          </View>

          <Pressable
            style={[styles.payButton, isProcessing && styles.buttonDisabled]}
            onPress={handlePay}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color={DesignColors.onPrimary} />
            ) : (
              <>
                <Ionicons name="lock-open-outline" size={20} color={DesignColors.onPrimary} />
                <Text style={styles.payButtonText}>Pay ₦{feeAmount.toLocaleString('en-US')} & View Location</Text>
              </>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSpacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: DesignColors.surface,
    borderRadius: DesignRadius.lg,
    padding: DesignSpacing.lg,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSpacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(74, 225, 118, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 6,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 20,
    marginBottom: DesignSpacing.md,
  },
  bold: {
    fontWeight: '700',
    color: DesignColors.onSurface,
  },
  feeCard: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    padding: DesignSpacing.md,
    alignItems: 'center',
    marginBottom: DesignSpacing.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  feeLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    letterSpacing: 1,
    marginBottom: 4,
  },
  feeAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: DesignColors.primaryBright,
    fontFamily,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: DesignSpacing.lg,
  },
  guaranteeText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DesignColors.primary,
    borderRadius: DesignRadius.md,
    paddingVertical: 14,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
});
