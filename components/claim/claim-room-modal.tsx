import { useCallback, useEffect, useState } from 'react';
import { Animated, Modal, Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { JoinGroupFlow } from '@/components/claim/join-group-flow';
import { OpenPodStep } from '@/components/claim/open-pod-step';
import { RoommateChoiceStep } from '@/components/claim/roommate-choice-step';
import { ClaimWizardBody } from '@/components/claim/claim-wizard-body';
import type { SelectedFriend } from '@/components/claim/friend-picker';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { useListing } from '@/hooks/use-listing';
import { useOpenPodsForListing } from '@/hooks/use-liquidity';
import { useJoinOpenPod } from '@/hooks/use-join-open-pod';
import { useReserveClaimSpot } from '@/hooks/use-reserve-claim-spot';
import { useAuth } from '@/context/auth-context';
import { useRoommateVisibility } from '@/hooks/useRoommateVisibility';
import { RoommateOnboardingSheet } from '@/components/roommate/roommate-onboarding-sheet';
import { isGenderCompatible, podEffectiveGender, podOpenSlotStatus , derivePropertyTier } from '@/utils/liquidity-math';
import type { Pod } from '@/types/liquidity';

import { generateInviteCode } from '@/services/liquidity-pod-service';
import { useDraggableSheet } from './use-draggable-sheet';
import { useEscapeKey } from './use-escape-key';
import { styles } from './claim-room-modal.styles';

type Props = {
  visible: boolean;
  listingId: string;
  onClose: () => void;
};

export function ClaimRoomModal({ visible, listingId, onClose }: Props) {
  const { data: detail, isLoading: listingLoading } = useListing(listingId);
  const { joinPod, isJoining } = useJoinOpenPod();
  const { profile } = useAuth();
  const { needsOnboarding } = useRoommateVisibility();
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
    if (wantsRoommates !== true || openPodsLoading || !openPods) return;
    console.log('[OpenPods] Checking whether this lodge has an empty slot this user can fill.');
    if (compatibleOpenPods.length === 0) {
      console.log('[OpenPods] No — this lodge has no pods that are looking for roommates for this user.');
      return;
    }
    for (const pod of compatibleOpenPods) {
      const s = podOpenSlotStatus(pod);
      console.log(
        `[OpenPods] Yes — this lodge has a pod that has ${s.occupied}/${s.target} member(s), so ${s.available} seat(s) are still free for this user.`,
      );
    }
  }, [wantsRoommates, openPodsLoading, openPods, compatibleOpenPods]);

  useEffect(() => {
    const resetToIdle = () => {
      setWantsRoommates(false);
    };
    if (!listingLoading && propertyTier <= 1 && wantsRoommates === null) {
      resetToIdle();
    }
  }, [listingLoading, propertyTier, wantsRoommates]);

  const isBuyout = wantsRoommates === false;
  const hasFriendsStep = !isBuyout && haveCount > 0;
  const totalSteps = isBuyout ? 2 : hasFriendsStep ? 5 : 4;
  const isConfirmStep = step === totalSteps;
  const peopleTotal = isBuyout ? 1 : 1 + roommateCount;
  const matchedCount = isBuyout ? 0 : Math.max(0, roommateCount - haveCount);
  const codeSeats = isBuyout ? 0 : Math.max(0, haveCount - friends.length);

  useEffect(() => {
    const resetModal = () => {
      setStep(1);
      setWantsRoommates(null);
      setRoommateCount(1);
      setHaveCount(0);
      setFriends([]);
      setInviteCode(generateInviteCode());
      setJoinMode(false);
      setShowOpenPods(false);
      setShowOnboarding(false);
    };
    if (!visible) {
      resetModal();
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

  const { reserve, isReserving } = useReserveClaimSpot({
    listing: dbListing,
    isBuyout,
    matchedCount,
    peopleTotal,
    inviteCode,
    friends,
    creatorGender: profile?.gender,
    creatorName: profile?.full_name ?? undefined,
    onReserved: onClose,
  });

  const handleJoinOpenPod = useCallback(
    async (pod: Pod) => {
      if (!dbListing) return;

      const credit = await joinPod({ pod, listing: dbListing });
      if (!credit) return;

      onClose();
      router.push({ pathname: '/property/pay-slot', params: { id: credit.id } });
    },
    [dbListing, joinPod, onClose],
  );

  const canContinue = step === 1 ? wantsRoommates !== null && (wantsRoommates !== true || !openPodsLoading) : true;

  const handleFooterPress = () => {
    if (isConfirmStep) {
      void reserve();
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
                joining={isReserving || isJoining}
                onJoin={handleJoinOpenPod}
                onDecline={() => {
                  setShowOpenPods(false);
                  setStep(2);
                }}
                onClose={onClose}
              />
            ) : step === 1 ? (
              <RoommateChoiceStep
                value={wantsRoommates}
                onChange={handleRoommateChoice}
                onJoinWithCode={() => setJoinMode(true)}
                onContinue={handleFooterPress}
                loading={isReserving || openPodsLoading}
                disabled={!canContinue}
              />
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
                isPurchasing={isReserving}
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
