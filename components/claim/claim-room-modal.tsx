import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors } from '@/constants/design';
import { RoommatePrompt } from '@/components/claim/roommate-prompt';
import { GroupSizeSelector } from '@/components/claim/group-size-selector';
import { ExistingFriendsSelector } from '@/components/claim/existing-friends-selector';
import { FriendPicker, type SelectedFriend } from '@/components/claim/friend-picker';
import { ClaimReview } from '@/components/claim/claim-review';
import { JoinGroupFlow } from '@/components/claim/join-group-flow';
import { JoinInviteCard } from '@/components/claim/join-invite-card';
import { WizardFooter } from '@/components/claim/wizard-footer';
import { WizardHeader } from '@/components/claim/wizard-header';
import { useAppToast } from '@/components/ui/toast-card';
import { useListing } from '@/hooks/use-listing';
import { useCreateSlotCredit } from '@/hooks/use-liquidity';
import { calculateBaseRent, calculatePlatformFee, calculateTotalUserCost, derivePropertyTier, EXPECTED_TOTAL_POD_FEE } from '@/utils/liquidity-math';
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
  const { mutateAsync: purchaseSlot, isPending: isPurchasing } = useCreateSlotCredit();
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

  const dbListing = detail?.dbListing;
  const listing = detail?.listing;
  const priceAmount = dbListing?.price_amount ?? 1200000;
  const propertyTier: number = derivePropertyTier(dbListing?.property_tier, dbListing?.max_roommates);

  useEffect(() => {
    if (!listingLoading && propertyTier <= 1 && wantsRoommates === null) {
      setWantsRoommates(false);
    }
  }, [listingLoading, propertyTier, wantsRoommates]);

  const isBuyout = wantsRoommates === false;
  const hasFriendsStep = !isBuyout && haveCount > 0;
  const totalSteps = isBuyout ? 2 : hasFriendsStep ? 5 : 4;
  const isConfirmStep = step === totalSteps;
  const peopleTotal = isBuyout ? propertyTier : 1 + roommateCount;
  const matchedCount = isBuyout ? 0 : Math.max(0, roommateCount - haveCount);
  const codeSeats = isBuyout ? 0 : Math.max(0, haveCount - friends.length);
  const pricingOccupancy = isBuyout ? 1 : peopleTotal;

  useEffect(() => {
    if (!visible) {
      setStep(1);
      setWantsRoommates(null);
      setRoommateCount(1);
      setHaveCount(0);
      setFriends([]);
      setInviteCode(generateInviteCode());
      setJoinMode(false);
    }
  }, [visible]);

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
      const { credit, synced } = await purchaseSlot({ listing: dbListing, targetOccupancy: peopleTotal, createCode: inviteCode });
      const message = isBuyout
        ? 'Spot reserved — the whole property is yours!'
        : matchedCount > 0
          ? `Spot secured! Gida will find ${matchedCount} roommate${matchedCount === 1 ? '' : 's'} for you.`
          : 'Spot secured! Invite your friends to keep the group together.';
      showToast({ message, type: 'success' });
      if (!synced) {
        showToast({ message: "Reserved locally — couldn't sync to the server. Sign in to persist your spot.", type: 'error' });
      }
      onClose();
      router.push({ pathname: '/property/pay-slot', params: { id: credit.id } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reserve spot.';
      showToast({ message, type: 'error' });
    }
  }, [dbListing, isBuyout, matchedCount, peopleTotal, purchaseSlot, showToast, onClose, inviteCode]);

  const baseRent = calculateBaseRent(priceAmount, pricingOccupancy);
  const platformFee = calculatePlatformFee(EXPECTED_TOTAL_POD_FEE, pricingOccupancy);
  const totalCost = calculateTotalUserCost(priceAmount, EXPECTED_TOTAL_POD_FEE, pricingOccupancy);

  const renderStep = () => {
    if (listingLoading) {
      return <ActivityIndicator size="large" color={DesignColors.primary} style={styles.center} />;
    }
    if (!listing && !dbListing) {
      return <Text style={styles.errorText}>Listing unavailable.</Text>;
    }
    if (step === 1) {
      return (
        <>
          <Text style={styles.title}>Would you like to have roommates?</Text>
          <Text style={styles.subtitle}>You can live alone, with friends, with matched roommates — or a mix.</Text>
          <RoommatePrompt value={wantsRoommates} onChange={setWantsRoommates} />
          <JoinInviteCard onPress={() => setJoinMode(true)} />
        </>
      );
    }
    if (isConfirmStep) {
      return (
        <>
          <Text style={styles.title}>{isBuyout ? 'Your private place' : 'Review & reserve'}</Text>
          <Text style={styles.subtitle}>
            {isBuyout ? 'You get the entire property to yourself.' : 'Lock in your group before paying.'}
          </Text>
          <ClaimReview
            listingTitle={listing?.title || 'Gida Property'}
            listingPriceLabel={`Max Capacity: ${propertyTier} • ₦${priceAmount.toLocaleString()}/yr`}
            listingImage={dbListing?.primary_image || listing?.image}
            friendsCount={friends.length}
            codeSeats={codeSeats}
            matchedCount={matchedCount}
            code={inviteCode}
            roster={friends}
            baseRent={baseRent}
            platformFee={platformFee}
            totalCost={totalCost}
          />
        </>
      );
    }
    if (step === 2) {
      return (
        <>
          <Text style={styles.title}>How many roommates do you want?</Text>
          <Text style={styles.subtitle}>This property fits up to {propertyTier} people total.</Text>
          <GroupSizeSelector capacity={propertyTier} value={roommateCount} onChange={changeRoommateCount} />
        </>
      );
    }
    if (step === 3) {
      return (
        <>
          <Text style={styles.title}>Do you already have these roommates?</Text>
          <Text style={styles.subtitle}>Tell us how many are friends — Gida fills the rest.</Text>
          <ExistingFriendsSelector roommateCount={roommateCount} value={haveCount} onChange={changeHaveCount} />
        </>
      );
    }
    return (
      <>
        <Text style={styles.title}>Add your roommates</Text>
        <Text style={styles.subtitle}>Search Gida for your friends — the rest join by code.</Text>
        <FriendPicker
          allowed={haveCount}
          selected={friends}
          code={inviteCode}
          codeSeats={codeSeats}
          matchedCount={matchedCount}
          onAdd={(friend) => setFriends((prev) => [...prev, friend])}
          onRemove={(id) => setFriends((prev) => prev.filter((friend) => friend.id !== id))}
        />
      </>
    );
  };

  const canContinue = step === 1 ? wantsRoommates !== null : true;
  const footerLabel = isConfirmStep ? 'Reserve My Spot' : 'Continue';

  const handleFooterPress = () => {
    if (isConfirmStep) {
      handleReserve();
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

              {joinMode ? (
                <JoinGroupFlow onClose={onClose} onExitJoin={() => setJoinMode(false)} />
              ) : (
                <>
                  <WizardHeader
                    step={step}
                    totalSteps={totalSteps}
                    canGoBack={step > 1}
                    onBack={() => setStep((current) => current - 1)}
                    onClose={onClose}
                  />

                  <View style={styles.divider} />

                  <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                  >
                    {renderStep()}
                  </ScrollView>

                  <WizardFooter
                    label={footerLabel}
                    icon={isConfirmStep ? 'shield-checkmark-outline' : 'arrow-forward'}
                    loading={isPurchasing}
                    disabled={!canContinue}
                    onPress={handleFooterPress}
                  />
                </>
              )}
            </Pressable>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
