import { useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { BackButton } from '@/components/ui/back-button';
import { useAppToast } from '@/components/ui/toast-card';
import { useUserSlotCredits, useExpireSlotCredit } from '@/hooks/use-liquidity';
import { useInitializeLodgePayment } from '@/hooks/use-lodge-payment';
import { verifyLodgePayment } from '@/services/lodge-payment-service';
import { extractReference } from '@/utils/paystack';
import { ClaimCountdown } from '@/components/claim/claim-countdown';
import { ReservationManagementCard } from '@/components/payment/reservation-management-card';

const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-US')}`;

export function PaymentCheckoutScreen({ creditId }: { creditId: string }) {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data: credits, isLoading } = useUserSlotCredits();
  const { mutateAsync: initPayment } = useInitializeLodgePayment();
  const { mutateAsync: expireCredit } = useExpireSlotCredit();

  const [isProcessing, setIsProcessing] = useState(false);
  const [locallyPaid, setLocallyPaid] = useState(false);
  const [locallyExpired, setLocallyExpired] = useState(false);

  const credit = credits?.find((c) => c.id === creditId);
  const isPaid = credit?.status === 'paid_unmatched' || locallyPaid;
  const isExpired = credit?.status === 'expired' || locallyExpired;
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
          window.location.href = result.authorizationUrl;
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <BackButton hasBackground={false} />
          <Text style={styles.topBarTitle}>Payment</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!credit) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <BackButton hasBackground={false} />
          <Text style={styles.topBarTitle}>Payment</Text>
        </View>
        <View style={styles.center}>
          <View style={styles.errorBadge}>
            <Ionicons name="alert-circle-outline" size={32} color={DesignColors.error} />
          </View>
          <Text style={styles.mutedText}>Reservation not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isPaid) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <BackButton hasBackground={false} />
          <Text style={styles.topBarTitle}>Payment</Text>
        </View>
        <View style={styles.center} testID="checkout-success">
          <View style={styles.successBadge}>
            <Ionicons name="checkmark" size={40} color={DesignColors.surface} />
          </View>
          <Text style={styles.successTitle}>Payment Successful</Text>
          <Text style={styles.successAmount}>{formatNaira(amount)}</Text>
          <View style={styles.successDivider} />
          <Text style={styles.mutedText}>{estateName}</Text>
        </View>
        <View style={styles.footer}>
          <Pressable style={styles.primaryButton} onPress={() => router.push(credit.target_occupancy === 1 ? { pathname: '/property/booking', params: { id: creditId } } : '/property/lobby')} testID="checkout-continue">
            <Ionicons name="arrow-forward" size={16} color={DesignColors.onPrimaryContainer} />
            <Text style={styles.primaryText}>{credit.target_occupancy === 1 ? 'View Booking' : 'Continue to Lobby'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isExpired) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <BackButton hasBackground={false} />
          <Text style={styles.topBarTitle}>Payment</Text>
        </View>
        <View style={styles.center}>
          <View style={styles.errorBadge}>
            <Ionicons name="time-outline" size={40} color={DesignColors.error} />
          </View>
          <Text style={styles.expiredTitle}>Your hold expired</Text>
          <Text style={styles.mutedText}>This reservation could not be paid before the 3-day deadline. Reserve again to restart the window.</Text>
        </View>
        <View style={styles.footer}>
          <Pressable style={styles.primaryButton} onPress={handleRelease} testID="checkout-release-btn">
            <Text style={styles.primaryText}>Release Hold</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <BackButton hasBackground={false} />
        <Text style={styles.topBarTitle}>Secure Your Spot</Text>
      </View>
      <ScrollView bounces={false} contentContainerStyle={styles.content}>
        <View style={styles.listingMini}>
          {credit.estate?.primary_image ? (
            <Image source={{ uri: credit.estate.primary_image }} style={styles.listingMiniImage} />
          ) : (
            <View style={styles.listingMiniIcon}>
              <Ionicons name="business-outline" size={20} color={DesignColors.primaryBright} />
            </View>
          )}
          <View style={styles.listingMiniInfo}>
            <Text style={styles.listingMiniSub}>RESIDENCE</Text>
            <Text style={styles.listingMiniTitle} numberOfLines={1}>{estateName}</Text>
            <Text style={styles.listingMiniMeta}>Capacity · {credit.property_tier} slots</Text>
          </View>
        </View>

        {!isPaid && !isExpired && (
          <ClaimCountdown expiresAt={credit.payment_deadline} onExpired={() => setLocallyExpired(true)} />
        )}

        <ReservationManagementCard credit={credit} />

        <View style={styles.amountCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionLabel}>TOTAL DUE TODAY</Text>
          </View>
          <Text style={styles.amountValue} testID="checkout-amount">{formatNaira(amount)}</Text>
          <View style={styles.amountDivider} />
          <Text style={styles.amountNote}>Covers your share of rent plus the platform service fee for this property.</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryButton, (isProcessing || locallyExpired) && styles.primaryButtonDisabled]}
          onPress={handlePay}
          disabled={isProcessing || locallyExpired}
          testID="checkout-pay-btn"
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={DesignColors.onPrimaryContainer} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={16} color={DesignColors.onPrimaryContainer} />
              <Text style={styles.primaryText}>Pay {formatNaira(amount)}</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surface },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, paddingHorizontal: DesignSpacing.md, paddingVertical: DesignSpacing.sm },
  topBarTitle: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700', fontSize: 17 },
  content: { padding: DesignSpacing.md, paddingBottom: DesignSpacing.xl, gap: DesignSpacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.md, padding: DesignSpacing.lg },
  footer: { padding: DesignSpacing.md, paddingTop: DesignSpacing.xs, gap: DesignSpacing.sm },
  mutedText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  sectionBar: { width: 3, height: 14, borderRadius: 2, backgroundColor: DesignColors.primaryBright },
  sectionLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1.4 },
  listingMini: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.lg, padding: DesignSpacing.md, borderWidth: 1, borderColor: DesignColors.borderFaint },
  listingMiniIcon: { width: 44, height: 44, borderRadius: DesignRadius.md, backgroundColor: DesignColors.primaryTint, borderWidth: 1, borderColor: DesignColors.primaryTintBorder, alignItems: 'center', justifyContent: 'center' },
  listingMiniImage: { width: 44, height: 44, borderRadius: DesignRadius.md },
  listingMiniInfo: { flex: 1, gap: 2 },
  listingMiniSub: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1.2 },
  listingMiniTitle: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  listingMiniMeta: { ...DesignTypography.labelSm, color: DesignColors.primaryBright, fontFamily, fontWeight: '600' },
  amountCard: { backgroundColor: DesignColors.primaryTint, borderWidth: 1, borderColor: DesignColors.primaryTintBorder, borderRadius: DesignRadius.xl, padding: DesignSpacing.lg, gap: DesignSpacing.xs },
  amountValue: { ...DesignTypography.headlineLg, color: DesignColors.primaryBright, fontFamily, fontWeight: '800', fontSize: 34 },
  amountDivider: { height: 1, backgroundColor: DesignColors.primaryTintBorder, marginVertical: DesignSpacing.sm },
  amountNote: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: DesignColors.primaryContainer, borderRadius: DesignRadius.full, paddingVertical: 16 },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryText: { ...DesignTypography.bodyLg, color: DesignColors.onPrimaryContainer, fontFamily, fontWeight: '700' },
  releaseLink: { alignItems: 'center', paddingVertical: DesignSpacing.xs },
  releaseText: { ...DesignTypography.bodyMd, color: DesignColors.error, fontFamily, fontWeight: '600', textDecorationLine: 'underline' },
  successBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: DesignColors.secondary, borderWidth: 6, borderColor: DesignColors.primaryTintMid, alignItems: 'center', justifyContent: 'center' },
  successTitle: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, fontWeight: '800' },
  successAmount: { ...DesignTypography.headlineLg, color: DesignColors.secondary, fontFamily, fontWeight: '800' },
  successDivider: { width: 48, height: 3, borderRadius: 2, backgroundColor: DesignColors.primaryBright, marginVertical: DesignSpacing.xs },
  errorBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: DesignColors.errorContainer, alignItems: 'center', justifyContent: 'center' },
  expiredTitle: { ...DesignTypography.headlineMd, color: DesignColors.error, fontFamily, fontWeight: '800' },
});
