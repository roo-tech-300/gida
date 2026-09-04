import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { DesignColors } from '@/constants/design';
import { GroupSizeSelector } from '@/components/claim/group-size-selector';
import { ExistingFriendsSelector } from '@/components/claim/existing-friends-selector';
import { FriendPicker, type SelectedFriend } from '@/components/claim/friend-picker';
import { ClaimReviewStep } from '@/components/claim/claim-review-step';
import { WizardFooter } from '@/components/claim/wizard-footer';
import { WizardHeader } from '@/components/claim/wizard-header';
import { StepTransition } from '@/components/claim/step-transition';
import { calculateBaseRent, calculatePlatformFee, calculateTotalUserCost, EXPECTED_TOTAL_POD_FEE } from '@/utils/liquidity-math';
import { styles } from './claim-room-modal.styles';

type Props = {
  step: number;
  totalSteps: number;
  listingLoading: boolean;
  listingAvailable: boolean;
  isBuyout: boolean;
  isConfirmStep: boolean;
  wantsRoommates: boolean | null;
  openPodsLoading: boolean;
  isPurchasing: boolean;
  propertyTier: number;
  priceAmount: number;
  listingTitle: string;
  listingPriceLabel: string;
  listingImage?: string | null;
  roommateCount: number;
  haveCount: number;
  friends: SelectedFriend[];
  inviteCode: string;
  matchedCount: number;
  codeSeats: number;
  onBack: () => void;
  onClose: () => void;
  onFooterPress: () => void;
  onRoommateCountChange: (count: number) => void;
  onHaveCountChange: (have: number) => void;
  onFriendAdd: (friend: SelectedFriend) => void;
  onFriendRemove: (id: string) => void;
};

export function ClaimWizardBody({
  step,
  totalSteps,
  listingLoading,
  listingAvailable,
  isBuyout,
  isConfirmStep,
  wantsRoommates,
  openPodsLoading,
  isPurchasing,
  propertyTier,
  priceAmount,
  listingTitle,
  listingPriceLabel,
  listingImage,
  roommateCount,
  haveCount,
  friends,
  inviteCode,
  matchedCount,
  codeSeats,
  onBack,
  onClose,
  onFooterPress,
  onRoommateCountChange,
  onHaveCountChange,
  onFriendAdd,
  onFriendRemove,
}: Props) {
  const pricingOccupancy = isBuyout ? 1 : 1 + roommateCount;
  const baseRent = calculateBaseRent(priceAmount, pricingOccupancy);
  const platformFee = calculatePlatformFee(EXPECTED_TOTAL_POD_FEE, pricingOccupancy);
  const totalCost = calculateTotalUserCost(priceAmount, EXPECTED_TOTAL_POD_FEE, pricingOccupancy);

  const footerLabel = isConfirmStep ? 'Reserve My Spot' : 'Continue';
  const footerLoading = isPurchasing || (step === 1 && wantsRoommates === true && openPodsLoading);

  const renderStep = () => {
    if (listingLoading) {
      return <ActivityIndicator size="large" color={DesignColors.primary} style={styles.center} />;
    }
    if (!listingAvailable) {
      return <Text style={styles.errorText}>Listing unavailable.</Text>;
    }
    if (step === 1) return null;
    if (isConfirmStep) {
      return (
        <ClaimReviewStep
          isBuyout={isBuyout}
          listingTitle={listingTitle}
          listingPriceLabel={listingPriceLabel}
          listingImage={listingImage}
          friendsCount={friends.length}
          codeSeats={codeSeats}
          matchedCount={matchedCount}
          code={inviteCode}
          roster={friends}
          baseRent={baseRent}
          platformFee={platformFee}
          totalCost={totalCost}
        />
      );
    }
    if (step === 2) {
      return (
        <>
          <Text style={styles.title}>How many roommates do you want?</Text>
          <Text style={styles.subtitle}>This property fits up to {propertyTier} people total.</Text>
          <GroupSizeSelector capacity={propertyTier} value={roommateCount} onChange={onRoommateCountChange} />
        </>
      );
    }
    if (step === 3) {
      return (
        <>
          <Text style={styles.title}>Do you already have these roommates?</Text>
          <Text style={styles.subtitle}>Tell us how many roomates you already have, and we will fill whatever space is left</Text>
          <ExistingFriendsSelector roommateCount={roommateCount} value={haveCount} onChange={onHaveCountChange} />
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
          onAdd={onFriendAdd}
          onRemove={onFriendRemove}
        />
      </>
    );
  };

  return (
    <>
      <WizardHeader
        step={step}
        totalSteps={totalSteps}
        canGoBack={step > 1}
        onBack={onBack}
        onClose={onClose}
      />

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
        <StepTransition stepKey={step} style={styles.stepContent}>
          {renderStep()}
        </StepTransition>
      </ScrollView>

      <WizardFooter
        label={footerLabel}
        icon={isConfirmStep ? undefined : 'arrow-forward'}
        loading={footerLoading}
        disabled={false}
        onPress={onFooterPress}
      />
    </>
  );
}
