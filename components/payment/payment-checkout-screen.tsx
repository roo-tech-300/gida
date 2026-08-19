import { useState, useCallback } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import { DesignColors } from '@/constants/design';
import { BackButton } from '@/components/ui/back-button';
import { useAppToast } from '@/components/ui/toast-card';
import { useUserSlotCredits, useExpireSlotCredit } from '@/hooks/use-liquidity';
import { useInitializeLodgePayment } from '@/hooks/use-lodge-payment';
import { verifyLodgePayment } from '@/services/lodge-payment-service';
import { extractReference } from '@/utils/paystack';
import { ClaimCountdown } from '@/components/claim/claim-countdown';
import { ReservationManagementCard } from '@/components/payment/reservation-management-card';
import { styles } from './payment-checkout.styles';

const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-US')}`;

function TopBar({ title }: { title: string }) {
  return (
    <View style={styles.topBar}>
      <BackButton hasBackground={false} />
      <Text style={styles.topBarTitle}>{title}</Text>
    </View>
  );
}

function GlassHeroCard({ estateName, imageUri, intentSize, targetOccupancy }: { estateName: string; imageUri?: string | null; intentSize: number; targetOccupancy: number }) {
  return (
    <View style={styles.heroCard}>
      {imageUri ? (
        <>
          <Image source={{ uri: imageUri }} style={styles.heroImage} />
          <View style={styles.heroGradient}>
            <Svg height="100%" width="100%">
              <Defs>
                <LinearGradient id="heroMask" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={DesignColors.surface} stopOpacity="0" />
                  <Stop offset="50%" stopColor={DesignColors.surface} stopOpacity="0.5" />
                  <Stop offset="100%" stopColor={DesignColors.surface} stopOpacity="0.95" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#heroMask)" />
            </Svg>
          </View>
        </>
      ) : (
        <View style={styles.heroFallback}>
          <Ionicons name="business-outline" size={28} color={DesignColors.primaryBright} />
        </View>
      )}
      <View style={styles.heroInfo}>
        <Text style={styles.heroLabel}>RESIDENCE</Text>
        <Text style={styles.heroTitle} numberOfLines={1}>{estateName}</Text>
        <View style={styles.heroMeta}>
          <View style={styles.heroMetaItem}>
            <Ionicons name="layers-outline" size={13} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.heroMetaText}>Buying {intentSize} of {targetOccupancy}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function GlassAmountCard({ amount }: { amount: number }) {
  return (
    <View style={styles.amountCard}>
      <View style={styles.amountHeader}>
        <View style={styles.amountBar} />
        <Text style={styles.amountLabel}>TOTAL DUE TODAY</Text>
      </View>
      <Text style={styles.amountValue} testID="checkout-amount">{formatNaira(amount)}</Text>
      <View style={styles.amountDivider} />
      <Text style={styles.amountNote}>Covers your share of rent.</Text>
    </View>
  );
}

export function PaymentCheckoutScreen({ creditId }: { creditId: string }) {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data: credits, isLoading, refetch } = useUserSlotCredits();
  const { mutateAsync: initPayment } = useInitializeLodgePayment();
  const { mutateAsync: expireCredit } = useExpireSlotCredit();

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

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

  if (isLoading) return (
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
          onPress={() => router.push(credit.target_occupancy === 1 ? { pathname: '/property/booking', params: { id: creditId } } : '/property/lobby')}
          testID="checkout-continue"
        >
          <Text style={styles.payText}>{credit.target_occupancy === 1 ? 'View Booking' : 'Continue to Lobby'}</Text>
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Secure Your Spot" />
      <ScrollView bounces={false} contentContainerStyle={styles.content}>
        <GlassHeroCard estateName={estateName} imageUri={credit.estate?.primary_image} intentSize={credit.intent_size} targetOccupancy={credit.target_occupancy} />
        {!isPaid && !isExpired && <ClaimCountdown expiresAt={credit.payment_deadline} onExpired={() => setLocallyExpired(true)} />}
        <ReservationManagementCard credit={credit} />
        <GlassAmountCard amount={amount} />
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
