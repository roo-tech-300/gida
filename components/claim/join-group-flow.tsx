import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { InviteCodeInput } from '@/components/claim/invite-code-input';
import { JoinConfirm } from '@/components/claim/join-confirm';
import { WizardFooter } from '@/components/claim/wizard-footer';
import { WizardHeader } from '@/components/claim/wizard-header';
import { useAppToast } from '@/components/ui/toast-card';
import { useCreateSlotCredit } from '@/hooks/use-liquidity';
import { useListing } from '@/hooks/use-listing';
import { calculateBaseRent, calculatePlatformFee, calculateTotalUserCost, derivePropertyTier, EXPECTED_TOTAL_POD_FEE } from '@/utils/liquidity-math';
import { findPodByGroupCode, currentUserId } from '@/services/liquidity-pod-service';
import type { Pod } from '@/types/liquidity';
import type { DbListing } from '@/types/feed-listing';
import { DesignColors } from '@/constants/design';
import { styles } from './claim-room-modal.styles';

type Props = {
  onClose: () => void;
  onExitJoin: () => void;
};

const FALLBACK_PRICE = 1200000;

export function JoinGroupFlow({ onClose, onExitJoin }: Props) {
  const { mutateAsync: purchaseSlot, isPending: isPurchasing } = useCreateSlotCredit();
  const { showToast } = useAppToast();

  const [step, setStep] = useState(1);
  const [code, setCode] = useState('');
  const [pod, setPod] = useState<Pod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const codeRef = useRef(code);
  codeRef.current = code;

  const { data: detail, isLoading: listingLoading } = useListing(pod?.listing_id ?? '');
  const dbListing: DbListing | undefined = detail?.dbListing;
  const listingTitle = detail?.listing.title ?? 'Gida Property';
  const listingImage = dbListing?.primary_image || detail?.listing.image;
  const propertyTier = derivePropertyTier(dbListing?.property_tier, dbListing?.max_roommates);
  const priceAmount = dbListing?.price_amount ?? FALLBACK_PRICE;
  const priceLabel = `Max Capacity: ${propertyTier} • ₦${priceAmount.toLocaleString()}/yr`;
  const seatNumber = pod ? pod.current_total_intent + 1 : 0;
  const joinTarget = pod?.target_occupancy ?? 1;
  const baseRent = calculateBaseRent(priceAmount, joinTarget);
  const platformFee = calculatePlatformFee(EXPECTED_TOTAL_POD_FEE, joinTarget);
  const totalCost = calculateTotalUserCost(priceAmount, EXPECTED_TOTAL_POD_FEE, joinTarget);

  const changeCode = (value: string) => {
    setCode(value);
    setPod(null);
    setError(null);
  };

  const handleValidate = useCallback(async () => {
    const normalized = code.trim().toUpperCase();
    if (normalized.length < 6) return;
    setValidating(true);
    setError(null);
    try {
      const found = await findPodByGroupCode(normalized);
      if (codeRef.current.trim().toUpperCase() !== normalized) return;
      if (!found) {
        setError("We couldn't find that code. Double-check it with your friend.");
        return;
      }
      if (found.current_total_intent + 1 > found.target_occupancy) {
        setError('This group is already full. Ask your friend for a new code.');
        return;
      }
      const userId = await currentUserId();
      if (!userId) {
        setError('Please sign in to join a group.');
        return;
      }
      const alreadyMember = found.members?.some((m) => m.user_id === userId);
      if (alreadyMember) {
        setError("You're already in this group. Head to your lobby to continue.");
        return;
      }
      setPod(found);
    } catch (caught) {
      if (codeRef.current.trim().toUpperCase() !== normalized) return;
      console.error('[JoinGroupFlow] Failed to validate invite code:', caught);
      setError('Something went wrong while checking the code. Try again.');
    } finally {
      setValidating(false);
    }
  }, [code]);

  const handleJoin = useCallback(async () => {
    if (!dbListing || !pod) return;
    const seat = pod.current_total_intent + 1;
    try {
      const { credit } = await purchaseSlot({
        listing: dbListing,
        targetOccupancy: pod.target_occupancy,
        joinCode: code.trim().toUpperCase(),
      });
      showToast({ message: `You're in! Seat ${seat} of ${pod.target_occupancy} is yours.`, type: 'success' });
      onClose();
      router.push({ pathname: '/property/pay-slot', params: { id: credit.id } });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Failed to join the group.';
      showToast({ message, type: 'error' });
    }
  }, [dbListing, pod, code, purchaseSlot, showToast, onClose]);

  const canContinue = step === 1 ? pod !== null && !validating : !listingLoading && !!dbListing;
  const footerLabel = step === 2 ? 'Join This Group' : 'Continue';
  const footerIcon: 'link-outline' | 'arrow-forward' = step === 2 ? 'link-outline' : 'arrow-forward';

  const handleBack = () => {
    if (step > 1) {
      setStep(1);
      return;
    }
    onExitJoin();
  };

  const handleFooterPress = () => {
    if (step === 2) {
      handleJoin();
      return;
    }
    setStep(2);
  };

  return (
    <>
      <WizardHeader step={step} totalSteps={2} canGoBack onBack={handleBack} onClose={onClose} />

      <View style={styles.divider} />

      <ScrollView
        style={styles.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {step === 1 ? (
          <>
            <Text style={styles.title}>Join with an invite code</Text>
            <Text style={styles.subtitle}>Enter the code your friend shared. You&apos;ll take the next open seat in their group.</Text>
            <InviteCodeInput
              code={code}
              validating={validating}
              error={error}
              pod={pod}
              onChangeCode={changeCode}
              onValidate={handleValidate}
              onExitJoin={onExitJoin}
            />
          </>
        ) : (
          <>
            <Text style={styles.title}>Review your seat</Text>
            <Text style={styles.subtitle}>You&apos;re joining an existing group — no roommate choices needed.</Text>
            {listingLoading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={DesignColors.primary} />
              </View>
            ) : dbListing && pod ? (
              <JoinConfirm
                listingTitle={listingTitle}
                listingImage={listingImage}
                priceLabel={priceLabel}
                seatNumber={seatNumber}
                totalSeats={joinTarget}
                baseRent={baseRent}
                platformFee={platformFee}
                totalCost={totalCost}
              />
            ) : (
              <Text style={styles.errorText}>
                We couldn&apos;t load this group&apos;s listing. Go back and try again.
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <WizardFooter
        label={footerLabel}
        icon={footerIcon}
        loading={isPurchasing}
        disabled={!canContinue}
        onPress={handleFooterPress}
      />
    </>
  );
}
