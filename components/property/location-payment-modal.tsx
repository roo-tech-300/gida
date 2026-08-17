import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Modal, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors } from '@/constants/design';
import { useDraggableSheet } from '@/components/claim/use-draggable-sheet';
import { useAppToast } from '@/components/ui/toast-card';
import { styles } from './location-payment-modal.styles';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onPay: () => Promise<boolean>;
  feeAmount?: number;
  propertyTitle?: string;
};

export function LocationPaymentModal({
  visible,
  onClose,
  onSuccess,
  onPay,
  feeAmount = 500,
  propertyTitle = 'Property Listing',
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useAppToast();
  const { panHandlers, sheetHeight } = useDraggableSheet();

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

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const unlocked = await onPay();
      if (unlocked) {
        onSuccess();
      }
    } catch (error) {
      console.error('[LocationPayment] Unlock payment failed:', error);
      showToast({ message: 'Payment could not be completed. Please try again.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
          <Pressable style={styles.sheetBody} onPress={(e) => e.stopPropagation()}>
            <View {...panHandlers} style={styles.handleArea}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <View style={styles.headerSide} />
              <View style={styles.stepWrap}>
                <Text style={styles.stepLabel}>LOCATION ACCESS</Text>
              </View>
              <Pressable onPress={onClose} style={styles.headerSide} hitSlop={8}>
                <Ionicons name="close" size={20} color={DesignColors.onSurfaceVariant} />
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.content}>
              <Text style={styles.title}>Unlock Location & Directions</Text>
              <Text style={styles.subtitle}>
                Pay a small verification fee to view the exact GPS coordinates and get directions for{' '}
                <Text style={styles.bold}>{propertyTitle}</Text>.
              </Text>

              <View style={styles.feeCard}>
                <Text style={styles.feeLabel}>LOCATION ACCESS FEE</Text>
                <Text style={styles.feeAmount}>₦{feeAmount.toLocaleString('en-US')}</Text>
              </View>

              <View style={styles.guaranteeRow}>
                <Ionicons name="shield-checkmark" size={16} color={DesignColors.primaryBright} />
                <Text style={styles.guaranteeText}>One-time fee per listing. Instant access.</Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                style={[styles.footerBtn, isProcessing && styles.buttonDisabled]}
                onPress={handlePay}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color={DesignColors.onPrimary} />
                ) : (
                  <>
                    <Ionicons name="lock-open-outline" size={18} color={DesignColors.onPrimary} />
                    <Text style={styles.footerBtnText}>
                      Pay ₦{feeAmount.toLocaleString('en-US')} & Unlock Directions
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
