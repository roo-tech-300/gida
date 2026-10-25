import { useState, useCallback, useRef, useEffect } from 'react';
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { DesignColors, DesignSpacing } from '@/constants/design';
import { formatNaira } from '@/utils/format-naira';
import { useAppToast } from '@/components/ui/toast-card';
import { useUserSlotCredits, useExpireSlotCredit } from '@/hooks/use-liquidity';
import { useInitializeLodgePayment } from '@/hooks/use-lodge-payment';
import { verifyLodgePayment } from '@/services/lodge-payment-service';
import { extractReference } from '@/utils/paystack';
import { ClaimCountdown } from '@/components/claim/claim-countdown';
import { ReservationManagementCard } from '@/components/payment/reservation-management-card';
import { CheckoutReservationError } from '@/components/payment/checkout-reservation-error';
import { CheckoutAmountCard, CheckoutHeroCard, CheckoutTopBar } from '@/components/payment/checkout-summary-cards';
import { PayCountdownButton } from './pay-countdown-button';
import { PaymentRefreshNudge } from './payment-refresh-nudge';
import { styles } from './payment-checkout.styles';

const PAID_CREDIT_STATUSES = new Set(['paid_unmatched', 'matched', 'subletting']);

export function PaymentCheckoutScreen({ creditId }: { creditId: string }) {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data: credits, isLoading, isFetching, isRefetching, status, error, refetch } = useUserSlotCredits();
  const { mutateAsync: initPayment } = useInitializeLodgePayment();
  const { mutateAsync: expireCredit } = useExpireSlotCredit();
  const [isProcessing, setIsProcessing] = useState(false);
  const [locallyPaid, setLocallyPaid] = useState(false);
  const [locallyExpired, setLocallyExpired] = useState(false);
  const [showRefreshNudge, setShowRefreshNudge] = useState(false);

  useFocusEffect(useCallback(() => {
    setShowRefreshNudge(false);
    refetch();
  }, [refetch]));

  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const credit = credits?.find((c) => c.id === creditId);

  // Derive a single deterministic state — evaluated top-down, first match wins.
  // This ensures only ONE state is ever shown at a time.
  const isPaid = (credit ? PAID_CREDIT_STATUSES.has(credit.status) : false) || locallyPaid;
  const isExpired = (credit?.status === 'expired') || locallyExpired;
  const isPendingVerification = !isPaid && !isExpired && credit?.pod_verification_status === 'pending_verification';
  const isRejected = !isPaid && !isExpired && !isPendingVerification && credit?.pod_verification_status === 'rejected';
  const isActive = !isPaid && !isExpired && !isPendingVerification && !isRejected;

  const amount = credit?.amount_paid ?? 0;
  const estateName = credit?.estate?.name || 'Gida Campus Residence';

  const handlePay = async () => {
    if (!credit) return;
    try {
      setIsProcessing(true);
      startRefreshNudgeCountdown();
      const paymentCheck = await refetch();
      if (paymentCheck.isError || !paymentCheck.data) {
        showToast({ message: 'We could not confirm your payment status. Please try again.', type: 'error' });
        return;
      }
      const latestCredit = paymentCheck.data.find((item) => item.id === creditId);
      if (!latestCredit) {
        showToast({ message: 'Reservation not found. Refresh and try again.', type: 'error' });
        return;
      }
      if (PAID_CREDIT_STATUSES.has(latestCredit.status)) {
        setLocallyPaid(true);
        setLocallyExpired(false);
        showToast({ message: 'You have already paid for this lodge.', type: 'info' });
        return;
      }
      if (latestCredit.status === 'expired' || latestCredit.pod_verification_status === 'rejected') {
        showToast({ message: 'This reservation is no longer eligible for payment.', type: 'error' });
        return;
      }
      if (latestCredit.pod_verification_status === 'pending_verification') {
        showToast({ message: 'Your reservation is still awaiting admin approval.', type: 'info' });
        return;
      }
      const result = await initPayment({
        creditId,
        listingId: latestCredit.listing_id ?? '',
        targetOccupancy: latestCredit.target_occupancy,
      });
      if (result.simulated) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setLocallyPaid(true);
        setLocallyExpired(false);
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
        setLocallyExpired(false);
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

  const startRefreshNudgeCountdown = useCallback(() => {
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    countdownTimerRef.current = setTimeout(() => setShowRefreshNudge(true), 5000);
  }, []);

  const handleRefresh = useCallback(async () => {
    setShowRefreshNudge(false);
    try {
      await refetch();
    } catch (error) {
      console.error('[PaymentCheckout] Pull-to-refresh failed:', error);
      showToast({ message: 'Failed to refresh payment status. Please try again.', type: 'error' });
    }
  }, [refetch, showToast]);

  useEffect(() => () => { if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current); }, []);

  // ── Loading ───────────────────────────────────────────────────────────────
  const waitingOnFetch = isLoading || status === 'pending' || (!credit && isFetching);
  if (waitingOnFetch) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CheckoutTopBar title="Application" />
      <View style={styles.center}>
        <ActivityIndicator size="large" color={DesignColors.primary} />
      </View>
    </SafeAreaView>
  );

  // ── Credit not found ──────────────────────────────────────────────────────
  if (!credit) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CheckoutTopBar title="Application" />
      <CheckoutReservationError hasError={!!error} onRetry={() => { void refetch(); }} />
    </SafeAreaView>
  );

  // ── Paid / confirmed ──────────────────────────────────────────────────────
  if (isPaid) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CheckoutTopBar title="Application" />
      <View style={styles.statusPage}>
        <View style={[styles.statusIconRing, styles.statusIconRingSuccess]}>
          <Ionicons name="checkmark-circle" size={48} color={DesignColors.success} />
        </View>
        <View style={styles.statusTextBlock}>
          <Text style={styles.statusTitle}>Payment confirmed</Text>
          <Text style={styles.statusSubtitle}>{estateName}</Text>
          <View style={[styles.statusChip, { borderColor: 'rgba(165,214,183,0.35)', backgroundColor: 'rgba(165,214,183,0.08)' }]}>
            <Ionicons name="shield-checkmark-outline" size={12} color={DesignColors.success} />
            <Text style={[styles.statusChipText, { color: DesignColors.success }]}>Your spot is secured</Text>
          </View>
          {amount > 0 && (
            <View style={styles.successAmountRow}>
              <Text style={styles.successAmount}>{formatNaira(amount)}</Text>
              <Text style={styles.successAmountLabel}>paid</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable
          style={styles.payButton}
          onPress={() => router.push(
            credit.target_occupancy === 1
              ? { pathname: '/property/booking', params: { id: creditId } }
              : { pathname: '/property/lobby', params: { creditId } }
          )}
          testID="checkout-continue"
        >
          <Text style={styles.payText}>{credit.target_occupancy === 1 ? 'View Booking' : 'Continue to Lobby'}</Text>
          <Ionicons name="arrow-forward" size={16} color={DesignColors.onPrimaryContainer} />
        </Pressable>
      </View>
    </SafeAreaView>
  );

  // ── Expired ───────────────────────────────────────────────────────────────
  if (isExpired) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CheckoutTopBar title="Application" />
      <View style={styles.statusPage}>
        <View style={[styles.statusIconRing, styles.statusIconRingExpired]}>
          <Ionicons name="time-outline" size={48} color={DesignColors.warning} />
        </View>
        <View style={styles.statusTextBlock}>
          <Text style={styles.statusTitle}>Application expired</Text>
          <Text style={styles.statusSubtitle}>
            Your reservation window closed before payment was completed. You can apply again from the property page.
          </Text>
          <View style={[styles.statusChip, { borderColor: 'rgba(255,208,138,0.3)', backgroundColor: 'rgba(255,208,138,0.08)' }]}>
            <Ionicons name="calendar-outline" size={12} color={DesignColors.warning} />
            <Text style={[styles.statusChipText, { color: DesignColors.warning }]}>3-day window closed</Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.payButton} onPress={handleRelease} testID="checkout-release-btn">
          <Text style={styles.payText}>Release &amp; Apply Again</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  // ── Pending admin review ──────────────────────────────────────────────────
  if (isPendingVerification) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CheckoutTopBar title="Application" />
      <View style={styles.statusPage}>
        <View style={[styles.statusIconRing, styles.statusIconRingPending]}>
          <Ionicons name="hourglass-outline" size={44} color={DesignColors.primaryBright} />
        </View>
        <View style={styles.statusTextBlock}>
          <Text style={styles.statusTitle}>Under review</Text>
          <Text style={styles.statusSubtitle}>
            The property admin is reviewing your application. You&apos;ll be notified and can complete payment once it&apos;s approved.
          </Text>
          <View style={[styles.statusChip, { borderColor: DesignColors.primaryTintBorder, backgroundColor: DesignColors.primaryTint }]}>
            <Ionicons name="time-outline" size={12} color={DesignColors.primaryBright} />
            <Text style={[styles.statusChipText, { color: DesignColors.primaryBright }]}>Awaiting admin approval</Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Back to Messages</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  // ── Rejected ──────────────────────────────────────────────────────────────
  if (isRejected) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CheckoutTopBar title="Application" />
      <View style={styles.statusPage}>
        <View style={[styles.statusIconRing, styles.statusIconRingError]}>
          <Ionicons name="close-circle-outline" size={48} color={DesignColors.error} />
        </View>
        <View style={styles.statusTextBlock}>
          <Text style={styles.statusTitle}>Application declined</Text>
          <Text style={styles.statusSubtitle}>
            The property admin didn&apos;t approve this application. You&apos;re free to explore other properties and apply again.
          </Text>
          <View style={[styles.statusChip, { borderColor: 'rgba(255,180,171,0.3)', backgroundColor: 'rgba(255,180,171,0.08)' }]}>
            <Ionicons name="information-circle-outline" size={12} color={DesignColors.error} />
            <Text style={[styles.statusChipText, { color: DesignColors.error }]}>Not approved</Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.payButton} onPress={() => router.back()} testID="checkout-back-btn">
          <Text style={styles.payText}>Explore Other Properties</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  // ── Active — ready to pay ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CheckoutTopBar title="Secure Your Spot" />
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
      >
        <CheckoutHeroCard
          estateName={estateName}
          imageUri={credit.estate?.primary_image}
          intentSize={credit.intent_size}
          targetOccupancy={credit.target_occupancy}
        />
        {isActive && (
          <ClaimCountdown
            expiresAt={credit.payment_deadline}
            onExpired={() => setLocallyExpired(true)}
          />
        )}
        {isActive && showRefreshNudge && <PaymentRefreshNudge />}
        <ReservationManagementCard credit={credit} />
        <CheckoutAmountCard amount={amount} />
        <View style={{ height: DesignSpacing.md }} />
      </ScrollView>
      <View style={styles.footer}>
        <PayCountdownButton
          amount={amount}
          onPress={handlePay}
          disabled={isProcessing || locallyExpired}
          testID="checkout-pay-btn"
        />
        {locallyExpired && !isProcessing && (
          <Pressable style={styles.releaseLink} onPress={handleRelease} testID="checkout-release-link">
            <Text style={styles.releaseText}>Hold expired — release spot</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

