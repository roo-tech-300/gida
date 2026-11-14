import { isEndedStatus } from '@/utils/credit-status';
import { useState, useCallback } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter , useFocusEffect } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { DesignColors } from '@/constants/design';
import { formatNaira } from '@/utils/format-naira';
import { useAppToast } from '@/components/ui/toast-card';
import { useUserSlotCredits, useExpireSlotCredit } from '@/hooks/use-liquidity';
import { useInitializeLodgePayment } from '@/hooks/use-lodge-payment';
import { verifyLodgePayment } from '@/services/lodge-payment-service';
import { extractReference } from '@/utils/paystack';
import { ClaimCountdown } from '@/components/claim/claim-countdown';
import { ReservationManagementCard } from '@/components/payment/reservation-management-card';
import { WhoPaysCard } from '@/components/payment/who-pays-card';
import { styles } from './payment-checkout.styles';
import { GlassAmountCard, GlassHeroCard, TopBar } from '@/components/payment/payment-checkout-parts';

export function PaymentCheckoutScreen({ creditId }: { creditId: string }) {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data: credits, isLoading, isFetching, status, refetch } = useUserSlotCredits();
  const { mutateAsync: initPayment } = useInitializeLodgePayment();
  const { mutateAsync: expireCredit } = useExpireSlotCredit();

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const [isProcessing, setIsProcessing] = useState(false);
  const [locallyPaid, setLocallyPaid] = useState(false);
  const [locallyExpired, setLocallyExpired] = useState(false);

  const credit = credits?.find((c) => c.id === creditId);
  const isPaid = credit?.status === 'paid_unmatched' || locallyPaid;
  const isExpired = isEndedStatus(credit?.status) || locallyExpired;
  const isPendingVerification = credit?.pod_verification_status === 'pending_verification';
  const isRejected = credit?.pod_verification_status === 'rejected';
  const amount = credit?.amount_paid ?? 0;
  const estateName = credit?.estate?.name || 'Gida Campus Residence';

  const handlePay = async () => {
    if (!credit) return;
    try {
      setIsProcessing(true);
      const result = await initPayment({
        creditId,
        listingId: credit.listing_id ?? '',
        targetOccupancy: credit.target_occupancy,
      });
      if (result.simulated) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setLocallyPaid(true);
        return;
      }
      if (!result.authorizationUrl) return;

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.location.assign(result.authorizationUrl);
        }
        return;
      }

      const redirectUrl = `gida://property/location-unlock-callback?listingId=${encodeURIComponent(credit.listing_id ?? '')}&creditId=${encodeURIComponent(creditId)}&targetOccupancy=${credit.target_occupancy}&kind=lodge`;
      const browserResult = await WebBrowser.openAuthSessionAsync(result.authorizationUrl, redirectUrl);
      const reference = browserResult.type === 'success'
        ? extractReference(browserResult.url) ?? result.reference
        : result.reference;
      if (!reference) return;

      const verified = await verifyLodgePayment(reference);
      if (verified.verified) {
        setLocallyPaid(true);
      } else {
        showToast({ message: 'Payment is pending confirmation. Your spot is held — please check back shortly.', type: 'info' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      showToast({ message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRelease = async () => {
    try {
      await expireCredit(creditId);
      showToast({ message: 'Hold released. You can reserve this property again.', type: 'info' });
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to release hold.';
      showToast({ message, type: 'error' });
    }
  };

  const waitingOnFetch = isLoading || status === 'pending' || (!credit && isFetching);

  if (waitingOnFetch) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Payment" />
      <View style={styles.center}><ActivityIndicator size="large" color={DesignColors.primary} /></View>
    </SafeAreaView>
  );

  if (!credit) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Payment" />
      <View style={styles.center}>
        <View style={styles.glassCenterCard}>
          <View style={styles.errorBadge}><Ionicons name="alert-circle-outline" size={32} color={DesignColors.error} /></View>
          <Text style={styles.mutedText}>Reservation not found.</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  if (isPaid) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Payment" />
      <View style={styles.center} testID="checkout-success">
        <View style={styles.glassCenterCard}>
          <View style={styles.successBadge}><Ionicons name="checkmark" size={40} color={DesignColors.surface} /></View>
          <Text style={styles.successTitle}>Payment Successful</Text>
          <Text style={styles.successAmount}>{formatNaira(amount)}</Text>
          <View style={styles.successDivider} />
          <Text style={styles.mutedText}>{estateName}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable
          style={styles.payButton}
          onPress={() => router.push(credit.target_occupancy === 1 ? { pathname: '/property/booking', params: { id: creditId } } : { pathname: '/property/lobby', params: { creditId } })}
          testID="checkout-continue"
        >
          <Text style={styles.payText}>{credit.target_occupancy === 1 ? 'View booking' : 'Open household'}</Text>
          <Ionicons name="arrow-forward" size={16} color={DesignColors.onPrimaryContainer} />
        </Pressable>
      </View>
    </SafeAreaView>
  );

  if (isExpired) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Payment" />
      <View style={styles.center}>
        <View style={styles.glassCenterCard}>
          <View style={styles.errorBadge}><Ionicons name="time-outline" size={40} color={DesignColors.error} /></View>
          <Text style={styles.expiredTitle}>Your hold expired</Text>
          <Text style={styles.mutedText}>This reservation could not be paid before the 3-day deadline. Reserve again to restart the window.</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.payButton} onPress={handleRelease} testID="checkout-release-btn">
          <Text style={styles.payText}>Release Hold</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  if (isPendingVerification) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Payment" />
      <View style={styles.center}>
        <View style={styles.glassCenterCard}>
          <View style={styles.pendingBadge}>
            <Ionicons name="hourglass-outline" size={36} color={DesignColors.primaryBright} />
          </View>
          <Text style={styles.pendingTitle}>Application pending</Text>
          <Text style={styles.pendingSubtitle}>
            Your application is being reviewed by the property admin. You&apos;ll be able to complete payment once it&apos;s approved.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );

  if (isRejected) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Payment" />
      <View style={styles.center}>
        <View style={styles.glassCenterCard}>
          <View style={[styles.pendingBadge, { backgroundColor: DesignColors.surfaceContainerHigh, borderColor: DesignColors.borderSoft }]}>
            <Ionicons name="close-outline" size={36} color={DesignColors.onSurfaceVariant} />
          </View>
          <Text style={styles.pendingTitle}>Application not approved</Text>
          <Text style={styles.pendingSubtitle}>
            Your application was not approved by the property admin. You can explore other properties and submit a new application.
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.payButton} onPress={() => router.back()} testID="checkout-back-btn">
          <Text style={styles.payText}>Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Secure Your Spot" />
      <ScrollView bounces={false} contentContainerStyle={styles.content}>
        <GlassHeroCard estateName={estateName} imageUri={credit.estate?.primary_image} intentSize={credit.intent_size} targetOccupancy={credit.target_occupancy} />
        {!isPaid && !isExpired && <ClaimCountdown expiresAt={credit.payment_deadline} onExpired={() => setLocallyExpired(true)} />}
        <GlassAmountCard amount={amount} />
        <WhoPaysCard creditId={creditId} amount={amount} placeTitle={estateName} />
        <ReservationManagementCard credit={credit} />
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          style={[styles.payButton, (isProcessing || locallyExpired) && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={isProcessing || locallyExpired}
          testID="checkout-pay-btn"
        >
          {isProcessing ? <ActivityIndicator size="small" color={DesignColors.onPrimaryContainer} /> : (
            <>
              <Ionicons name="lock-closed" size={16} color={DesignColors.onPrimaryContainer} />
              <Text style={styles.payText}>Pay {formatNaira(amount)}</Text>
            </>
          )}
        </Pressable>
        {locallyExpired && !isProcessing && (
          <Pressable style={styles.releaseLink} onPress={handleRelease} testID="checkout-release-link">
            <Text style={styles.releaseText}>Hold expired — release spot</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
