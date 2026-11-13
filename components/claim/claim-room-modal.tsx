import { useCallback, useEffect, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { RoommatePrompt } from '@/components/claim/roommate-prompt';
import { JoinGroupFlow } from '@/components/claim/join-group-flow';
import { JoinInviteCard } from '@/components/claim/join-invite-card';
import { OpenPodStep } from '@/components/claim/open-pod-step';
import { WizardFooter } from '@/components/claim/wizard-footer';
import { ClaimWizardBody } from '@/components/claim/claim-wizard-body';
import type { SelectedFriend } from '@/components/claim/friend-picker';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { useAppToast } from '@/components/ui/toast-card';
import { useListing } from '@/hooks/use-listing';
import { useCreateSlotCredit, useOpenPodsForListing } from '@/hooks/use-liquidity';
import { useAuth } from '@/context/auth-context';
import { useRoommateVisibility } from '@/hooks/useRoommateVisibility';
import { RoommateOnboardingSheet } from '@/components/roommate/roommate-onboarding-sheet';
import { notifyAdminOfReservation } from '@/services/lodge-reservation-notify';
import { isGenderCompatible, podEffectiveGender, derivePropertyTier } from '@/utils/liquidity-math';

import { generateInviteCode } from '@/services/liquidity-pod-service';
import { useDraggableSheet } from './use-draggable-sheet';
import { useEscapeKey } from './use-escape-key';
import { styles } from './claim-room-modal.styles';
import { computeClaimPlan, reservationSuccessMessage } from '@/utils/claim-plan';
import { useJoinOpenPod } from '@/hooks/use-join-open-pod';

type Props = {
  visible: boolean;
  listingId: string;
  onClose: () => void;
};

export function ClaimRoomModal({ visible, listingId, onClose }: Props) {
  const { data: detail, isLoading: listingLoading } = useListing(listingId);
  const { mutateAsync: purchaseSlot, isPending: isPurchasing } = useCreateSlotCredit();
  const { profile } = useAuth();
  const { needsOnboarding } = useRoommateVisibility();
  const { showToast } = useAppToast();
  const { panHandlers, sheetHeight } = useDraggableSheet();
  useEscapeKey(onClose, visible);

  const [step, setStep] = useState(1);
  const [wantsRoommates, setWantsRoommates] = useState<boolean | null>(null);
  const [roommateCount, setRoommateCount] = useState(1);
  const [haveCount, setHaveCount] = useState(0);
  const [friends, setFriends] = useState<SelectedFriend[]>([]);
  const [inviteCode, setInviteCode] = useState(generateInviteCode);
  const [joinMode, setJoinMode] = useState(false);
  const [showOpenPods, setShowOpenPods] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const dbListing = detail?.dbListing;
  const listing = detail?.listing;
  const priceAmount = dbListing?.price_amount ?? 1200000;
  const propertyTier: number = derivePropertyTier(dbListing?.property_tier, dbListing?.max_roommates);

  const { data: openPods, isLoading: openPodsLoading } = useOpenPodsForListing(dbListing?.id, visible && wantsRoommates === true && !showOpenPods);
  const compatibleOpenPods = (openPods ?? []).filter((pod) => isGenderCompatible(podEffectiveGender(pod), profile?.gender));
  const hasOpenPods = compatibleOpenPods.length > 0;

  useEffect(() => {
    if (!listingLoading && propertyTier <= 1 && wantsRoommates === null) {
      setWantsRoommates(false);
    }
  }, [listingLoading, propertyTier, wantsRoommates]);

  const { isBuyout, hasFriendsStep, totalSteps, peopleTotal, matchedCount, codeSeats } = computeClaimPlan(
    wantsRoommates, roommateCount, haveCount, friends.length,
  );
  const isConfirmStep = step === totalSteps;

  useEffect(() => {
    if (!visible) {
      setStep(1);
      setWantsRoommates(null);
      setRoommateCount(1);
      setHaveCount(0);
      setFriends([]);
      setInviteCode(generateInviteCode());
      setJoinMode(false);
      setShowOpenPods(false);
      setShowOnboarding(false);
    }
  }, [visible]);

  const handleRoommateChoice = (value: boolean | null) => {
    if (value === true && needsOnboarding) {
      setShowOnboarding(true);
      return;
    }
    setWantsRoommates(value);
  };

  const changeRoommateCount = (count: number) => {
    setRoommateCount(count);
    setHaveCount((prev) => Math.min(prev, count));
    setFriends((prev) => prev.slice(0, count));
  };

  const changeHaveCount = (have: number) => {
    setHaveCount(have);
    setFriends((prev) => prev.slice(0, have));
  };

  const handleReserve = useCallback(async () => {
    if (!dbListing) return;
    try {
      const { credit, podId } = await purchaseSlot({
        listing: dbListing,
        targetOccupancy: peopleTotal,
        createCode: inviteCode,
        invitedFriends: friends.map((friend) => ({ id: friend.id, name: friend.name })),
        creatorGender: profile?.gender,
      });
      const message = reservationSuccessMessage(isBuyout, matchedCount);
      showToast({ message, type: 'success' });
      try {
        await notifyAdminOfReservation({ podId, listingId: dbListing.id, creditId: credit.id, userName: profile?.full_name ?? 'A resident' });
      } catch (notifyErr) {
        console.error('[ClaimModal] 5. Admin notification FAILED:', notifyErr);
      }
      onClose();
      router.push({ pathname: '/property/pay-slot', params: { id: credit.id } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reserve spot.';
      showToast({ message, type: 'error' });
    }
  }, [dbListing, isBuyout, matchedCount, peopleTotal, purchaseSlot, showToast, onClose, inviteCode, friends, profile?.gender]);

  const handleJoinOpenPod = useJoinOpenPod(dbListing, purchaseSlot, onClose);

  const canContinue = step === 1 ? wantsRoommates !== null && (wantsRoommates !== true || !openPodsLoading) : true;

  const handleFooterPress = () => {
    if (isConfirmStep) {
      handleReserve();
      return;
    }
    if (step === 1 && wantsRoommates === true && hasOpenPods) {
      setShowOpenPods(true);
      return;
    }
    setStep((current) => current + 1);
  };

  const handleOnboardingDismiss = () => {
    setShowOnboarding(false);
    setWantsRoommates(true);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeKeyboardView style={styles.flex}>
        <View style={styles.backdrop}>
          <Pressable style={styles.scrimSpace} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
          <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
            <View {...panHandlers} style={styles.handleArea}>
              <View style={styles.handle} />
            </View>

            {joinMode ? (
              <JoinGroupFlow onClose={onClose} onExitJoin={() => setJoinMode(false)} />
            ) : showOpenPods && dbListing ? (
              <OpenPodStep
                listing={dbListing}
                myGender={profile?.gender}
                joining={isPurchasing}
                onJoin={handleJoinOpenPod}
                onDecline={() => {
                  setShowOpenPods(false);
                  setStep(2);
                }}
                onClose={onClose}
              />
            ) : step === 1 ? (
              <>
                <View style={styles.divider} />
                <ScrollView
                  style={styles.scroll}
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.content}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  removeClippedSubviews={false}
                >
                  <Text style={styles.title}>Would you like to have roommates?</Text>
                  <Text style={styles.subtitle}>You can live alone, with friends, with matched roommates — or a mix.</Text>
                  <RoommatePrompt value={wantsRoommates} onChange={handleRoommateChoice} />
                  <JoinInviteCard onPress={() => setJoinMode(true)} />
                </ScrollView>
                <WizardFooter
                  label="Continue"
                  icon="arrow-forward"
                  loading={isPurchasing || openPodsLoading}
                  disabled={!canContinue}
                  onPress={handleFooterPress}
                />
              </>
            ) : (
              <ClaimWizardBody
                step={step}
                totalSteps={totalSteps}
                listingLoading={listingLoading}
                listingAvailable={!!(listing || dbListing)}
                isBuyout={isBuyout}
                isConfirmStep={isConfirmStep}
                wantsRoommates={wantsRoommates}
                openPodsLoading={openPodsLoading}
                isPurchasing={isPurchasing}
                propertyTier={propertyTier}
                priceAmount={priceAmount}
                listingTitle={listing?.title || 'Gida Property'}
                listingPriceLabel={`Max Capacity: ${propertyTier} • ₦${priceAmount.toLocaleString()}/yr`}
                listingImage={dbListing?.primary_image || listing?.image}
                roommateCount={roommateCount}
                haveCount={haveCount}
                friends={friends}
                inviteCode={inviteCode}
                matchedCount={matchedCount}
                codeSeats={codeSeats}
                onBack={() => setStep((c) => c - 1)}
                onClose={onClose}
                onFooterPress={handleFooterPress}
                onRoommateCountChange={changeRoommateCount}
                onHaveCountChange={changeHaveCount}
                onFriendAdd={(f) => setFriends((prev) => [...prev, f])}
                onFriendRemove={(id) => setFriends((prev) => prev.filter((f) => f.id !== id))}
              />
            )}
          </Animated.View>
        </View>
      </SafeKeyboardView>
      <RoommateOnboardingSheet visible={showOnboarding} onDismiss={handleOnboardingDismiss} />
    </Modal>
  );
}
