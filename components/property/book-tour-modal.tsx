import { useEffect, useState } from 'react';
import { Animated, Linking, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';

import { DesignColors } from '@/constants/design';
import { useDraggableSheet } from '@/components/claim/use-draggable-sheet';
import { useUnlockedListings } from '@/hooks/use-location-access';
import { initializeLocationPayment, verifyLocationPayment } from '@/services/location-access-service';
import { extractReference } from '@/utils/paystack';
import { LocationPaymentModal } from './location-payment-modal';
import { LocationCheckStep } from './location-check-step';
import { TourOptionCard } from './tour-option-card';
import { styles } from './book-tour-modal.styles';

type Props = {
  visible: boolean;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  latitude?: number;
  longitude?: number;
  locationFee?: number;
  onClose: () => void;
  onAssistedTour: () => void;
};

type Step = 'type' | 'unassisted';

export function BookTourModal({
  visible,
  propertyId,
  propertyTitle,
  propertyLocation,
  latitude,
  longitude,
  locationFee,
  onClose,
  onAssistedTour,
}: Props) {
  const [step, setStep] = useState<Step>('type');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [unlockedOverride, setUnlockedOverride] = useState<boolean | null>(null);
  const { data: unlockedIds } = useUnlockedListings();
  const queryClient = useQueryClient();
  const { panHandlers, sheetHeight } = useDraggableSheet();

  const isUnlocked = unlockedOverride ?? (unlockedIds?.includes(propertyId) ?? false);

  useEffect(() => {
    if (!visible) {
      setStep('type');
      setPaymentOpen(false);
      setUnlockedOverride(null);
    }
  }, [visible]);

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

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(propertyLocation || propertyTitle)}`;

  const handleGetDirections = () => {
    Linking.openURL(directionsUrl).catch(() => {});
  };

  const fee = (locationFee ?? 500).toLocaleString('en-US');

  const handlePay = async (): Promise<boolean> => {
    try {
      const init = await initializeLocationPayment(propertyId);
      if (init.simulated) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setUnlockedOverride(true);
        return true;
      }
      if (!init.authorizationUrl) {
        return false;
      }
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.location.href = init.authorizationUrl;
        }
        return false;
      }

      const redirectUrl = `gida://property/location-unlock-callback?listingId=${propertyId}`;
      const result = await WebBrowser.openAuthSessionAsync(init.authorizationUrl, redirectUrl);
      const reference = result.type === 'success' ? extractReference(result.url) ?? init.reference : init.reference;
      if (!reference) {
        return false;
      }
      const verified = await verifyLocationPayment(reference);
      if (verified.unlocked) {
        setUnlockedOverride(true);
        queryClient.invalidateQueries({ queryKey: ['location-access'] });
      }
      return verified.unlocked;
    } catch (error) {
      console.error('[BookTourModal] Unlock payment flow failed:', error);
      return false;
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
              {step === 'type' ? (
                <View style={styles.headerSide} />
              ) : (
                <Pressable onPress={() => setStep('type')} style={styles.headerSide} hitSlop={8}>
                  <Ionicons name="chevron-back" size={20} color={DesignColors.onSurfaceVariant} />
                </Pressable>
              )}
              <View style={styles.stepWrap}>
                <Text style={styles.stepLabel}>{step === 'type' ? 'BOOK A TOUR' : 'LOCATION CHECK'}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.headerSide} hitSlop={8}>
                <Ionicons name="close" size={20} color={DesignColors.onSurfaceVariant} />
              </Pressable>
            </View>

            <View style={styles.divider} />

            {step === 'type' ? (
              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                style={styles.scroll}
              >
                <Text style={styles.title}>How would you like to visit?</Text>
                <Text style={styles.subtitle}>
                  Choose how you&apos;d like to explore <Text style={styles.bold}>{propertyTitle}</Text>.
                </Text>

                <View style={styles.optionList}>
                  <TourOptionCard
                    icon="people-outline"
                    label="GUIDED"
                    title="Guided Full Inspection"
                    description="Explore the inside with a Gida Agent. Full interior access, inspect amenities, and ask questions on the spot."
                    feeLabel="₦2,000 guided tour"
                    onPress={onAssistedTour}
                  />
                  <TourOptionCard
                    icon="navigate-outline"
                    label="SOLO"
                    title="Location & Exterior Check"
                    description="Visit on your own time. Perfect for scoping out the neighborhood and exact location (exterior only)."
                    feeLabel={`₦${fee} exterior unlock`}
                    onPress={() => setStep('unassisted')}
                  />
                </View>
              </ScrollView>
            ) : (
              <LocationCheckStep
                propertyLocation={propertyLocation}
                latitude={latitude}
                longitude={longitude}
                isUnlocked={isUnlocked}
                fee={fee}
                onUnlock={() => setPaymentOpen(true)}
                onGetDirections={handleGetDirections}
                onBack={() => setStep('type')}
              />
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
      <LocationPaymentModal
        visible={paymentOpen}
        feeAmount={locationFee}
        propertyTitle={propertyTitle}
        onClose={() => setPaymentOpen(false)}
        onPay={handlePay}
        onSuccess={() => {
          setPaymentOpen(false);
        }}
      />
    </Modal>
  );
}
