import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors } from '@/constants/design';
import { ClaimRulesCard } from '@/components/claim/claim-rules-card';
import { ClaimSplitSummary } from '@/components/claim/claim-split-summary';
import { IntentSelector } from '@/components/claim/intent-selector';
import { MoveInStyleSelector, type MoveInMode } from '@/components/claim/move-in-style-selector';
import { useAppToast } from '@/components/ui/toast-card';
import { useListing } from '@/hooks/use-listing';
import { useCreateSlotCredit } from '@/hooks/use-liquidity';
import { calculateBaseRent, calculatePlatformFee, calculateTotalUserCost, derivePropertyTier, EXPECTED_TOTAL_POD_FEE } from '@/utils/liquidity-math';
import { useDraggableSheet } from './use-draggable-sheet';
import { styles } from './claim-room-modal.styles';

type Props = {
  visible: boolean;
  listingId: string;
  onClose: () => void;
};

export function ClaimRoomModal({ visible, listingId, onClose }: Props) {
  const { data: detail, isLoading: listingLoading } = useListing(listingId);
  const { mutateAsync: purchaseSlot, isPending: isPurchasing } = useCreateSlotCredit();
  const { showToast } = useAppToast();
  const { panHandlers, sheetHeight } = useDraggableSheet();

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<MoveInMode>('solo');
  const [friendCode, setFriendCode] = useState('');
  const [selectedOccupancy, setSelectedOccupancy] = useState(1);

  const dbListing = detail?.dbListing;
  const listing = detail?.listing;
  const priceAmount = dbListing?.price_amount ?? 1200000;
  const propertyTier: number = derivePropertyTier(dbListing?.property_tier, dbListing?.max_roommates);
  const isSingleOccupancy = dbListing?.max_roommates === 1;
  const rules = dbListing?.rules ?? ['No smoking indoors', 'Quiet hours after 10 PM'];

  const totalSteps = isSingleOccupancy ? 1 : mode === 'friends' ? 3 : 2;
  const isConfirmStep = step === totalSteps;
  const occupancy = isSingleOccupancy ? 1 : mode === 'friends' ? selectedOccupancy : 1;

  useEffect(() => {
    if (!visible) {
      setStep(1);
      setFriendCode('');
    }
  }, [visible]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) onClose();
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

  const handleConfirm = useCallback(async () => {
    if (!dbListing) return;
    const joinCode = !isSingleOccupancy && mode === 'friends' ? friendCode.trim() : '';
    try {
      const { credit, synced } = await purchaseSlot({
        listing: dbListing,
        targetOccupancy: occupancy,
        joinCode: joinCode || undefined,
      });

      if (!isSingleOccupancy && mode === 'friends') {
        showToast(
          joinCode
            ? { message: "Joined your friend's group!", type: 'success' }
            : { message: `Spot secured! Share invite code ${credit.invite_code ?? ''} with your friend.`, type: 'success' },
        );
      } else if (!isSingleOccupancy && mode === 'matchmaking') {
        showToast({ message: "Spot reserved! We'll pair you with compatible roommates.", type: 'success' });
      } else {
        showToast({ message: 'Spot reserved! Welcome to Gida.', type: 'success' });
      }
      if (!synced) {
        showToast({ message: "Reserved locally — couldn't sync to the server. Sign in to persist your spot.", type: 'error' });
      }
      onClose();
      router.push({ pathname: '/property/pay-slot', params: { id: credit.id } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reserve spot.';
      showToast({ message, type: 'error' });
    }
  }, [dbListing, isSingleOccupancy, mode, friendCode, occupancy, purchaseSlot, showToast, onClose]);

  const baseRent = calculateBaseRent(priceAmount, occupancy);
  const platformFee = calculatePlatformFee(EXPECTED_TOTAL_POD_FEE, occupancy);
  const totalCost = calculateTotalUserCost(priceAmount, EXPECTED_TOTAL_POD_FEE, occupancy);

  const renderConfirmStep = () => (
    <>
      <Text style={styles.title}>
        {isSingleOccupancy || mode === 'solo' ? 'Confirm your reservation' : mode === 'matchmaking' ? 'Confirm & get matched' : 'Confirm your group reservation'}
      </Text>
      <Text style={styles.subtitle}>
        {isSingleOccupancy || mode === 'solo'
          ? 'Review your spot before securing it.'
          : mode === 'matchmaking'
            ? 'We&apos;ll pair you with compatible roommates after checkout.'
            : 'Review your group&apos;s split before securing the spot.'}
      </Text>
      <View style={styles.listingMini}>
        <View style={styles.listingAccent} />
        {(dbListing?.primary_image || listing?.image) && (
          <Image source={{ uri: dbListing?.primary_image || listing?.image }} style={styles.listingThumb} />
        )}
        <View style={styles.listingMiniInfo}>
          <Text style={styles.listingMiniTitle} numberOfLines={1}>{listing?.title || 'Gida Property'}</Text>
          <Text style={styles.listingMiniPrice}>Max Capacity: {propertyTier} • ₦{priceAmount.toLocaleString()}/yr</Text>
        </View>
      </View>
      <ClaimSplitSummary baseRent={baseRent} platformFee={platformFee} totalCost={totalCost} />
      <ClaimRulesCard rules={rules} maxRoommates={propertyTier} />
    </>
  );

  const renderBody = () => {
    if (listingLoading) {
      return <ActivityIndicator size="large" color={DesignColors.primary} style={styles.center} />;
    }
    if (!listing && !dbListing) {
      return <Text style={styles.errorText}>Listing unavailable.</Text>;
    }
    if (!isSingleOccupancy && step === 1) {
      return (
        <>
          <Text style={styles.title}>How are you moving in?</Text>
          <Text style={styles.subtitle}>Choose how you&apos;d like to secure your spot.</Text>
          <MoveInStyleSelector
            mode={mode}
            onChangeMode={setMode}
            friendCode={friendCode}
            onChangeFriendCode={setFriendCode}
          />
        </>
      );
    }
    if (!isSingleOccupancy && mode === 'friends' && step === 2) {
      return (
        <>
          <Text style={styles.title}>How many people are moving in?</Text>
          <Text style={styles.subtitle}>This property supports up to {propertyTier} roommates in one group.</Text>
          <IntentSelector propertyTier={propertyTier} selectedIntent={selectedOccupancy} onSelectIntent={setSelectedOccupancy} />
        </>
      );
    }
    return renderConfirmStep();
  };

  const handleFooterPress = () => {
    if (isConfirmStep) {
      handleConfirm();
      return;
    }
    setStep((current) => current + 1);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
            <Pressable style={styles.sheetBody} onPress={(e) => e.stopPropagation()}>
              <View {...panHandlers} style={styles.handleArea}>
                <View style={styles.handle} />
              </View>

              <View style={styles.header}>
                <View style={styles.headerSide} />
                {!isSingleOccupancy && (
                  <View style={styles.stepWrap}>
                    <Text style={styles.stepLabel}>STEP {step} OF {totalSteps}</Text>
                    <View style={styles.progressTrack}>
                      {Array.from({ length: totalSteps }, (_, index) => (
                        <View key={index} style={[styles.progressSegment, index < step && styles.progressSegmentActive]} />
                      ))}
                    </View>
                  </View>
                )}
                {step > 1 || isSingleOccupancy ? (
                  <Pressable onPress={onClose} style={styles.headerSide} hitSlop={8}>
                    <Ionicons name="close" size={20} color={DesignColors.onSurfaceVariant} />
                  </Pressable>
                ) : (
                  <View style={styles.headerSide} />
                )}
              </View>

              <View style={styles.divider} />

              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
              >
                {renderBody()}
              </ScrollView>

              <View style={styles.footer}>
                <Pressable
                  style={[styles.footerBtn, isPurchasing && styles.footerBtnDisabled]}
                  onPress={handleFooterPress}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color={DesignColors.onPrimary} />
                  ) : (
                    <View style={styles.footerBtnRow}>
                      <Text style={styles.footerBtnText}>{isConfirmStep ? 'Confirm & Secure Spot' : 'Continue'}</Text>
                      <Ionicons name="arrow-forward" size={16} color={DesignColors.onPrimary} />
                    </View>
                  )}
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
