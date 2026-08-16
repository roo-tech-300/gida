import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { BackButton } from '@/components/ui/back-button';
import { useAppToast } from '@/components/ui/toast-card';
import { useUserSlotCredits, useMarkSlotCreditPaid, useExpireSlotCredit } from '@/hooks/use-liquidity';
import { ClaimCountdown } from '@/components/claim/claim-countdown';

type PaymentMethod = 'card' | 'transfer' | 'ussd';

const METHODS: { id: PaymentMethod; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'card', title: 'Debit / Credit Card', subtitle: 'Visa, Mastercard, Verve', icon: 'card-outline' },
  { id: 'transfer', title: 'Bank Transfer', subtitle: 'Instant virtual account', icon: 'cash-outline' },
  { id: 'ussd', title: 'USSD', subtitle: 'Dial *737# on your bank line', icon: 'phone-portrait-outline' },
];

const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-US')}`;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function PaymentCheckoutScreen({ creditId }: { creditId: string }) {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data: credits, isLoading } = useUserSlotCredits();
  const { mutateAsync: payCredit } = useMarkSlotCreditPaid();
  const { mutateAsync: expireCredit } = useExpireSlotCredit();

  const [method, setMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [locallyPaid, setLocallyPaid] = useState(false);
  const [locallyExpired, setLocallyExpired] = useState(false);

  const credit = credits?.find((c) => c.id === creditId);
  const isPaid = credit?.status === 'paid_unmatched' || locallyPaid;
  const isExpired = credit?.status === 'expired' || locallyExpired;
  const amount = credit?.amount_paid ?? 0;
  const estateName = credit?.estate?.name || 'Gida Campus Residence';
  const selectedMethod = METHODS.find((m) => m.id === method);

  const handlePay = async () => {
    try {
      setIsProcessing(true);
      await delay(1500);
      await payCredit(creditId);
      setLocallyPaid(true);
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
          <Text style={styles.mutedText}>{estateName} • {selectedMethod?.title}</Text>
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
          <View style={styles.listingMiniIcon}>
            <Ionicons name="business-outline" size={20} color={DesignColors.primaryBright} />
          </View>
          <View style={styles.listingMiniInfo}>
            <Text style={styles.listingMiniSub}>RESIDENCE</Text>
            <Text style={styles.listingMiniTitle} numberOfLines={1}>{estateName}</Text>
            <Text style={styles.listingMiniMeta}>Capacity · {credit.property_tier} slots</Text>
          </View>
        </View>

        <ClaimCountdown expiresAt={credit.payment_deadline} onExpired={() => setLocallyExpired(true)} />

        <View style={styles.amountCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionLabel}>TOTAL DUE TODAY</Text>
          </View>
          <Text style={styles.amountValue} testID="checkout-amount">{formatNaira(amount)}</Text>
          <View style={styles.amountDivider} />
          <Text style={styles.amountNote}>Covers your share of rent plus the platform service fee for this property.</Text>
        </View>

        <View style={styles.methodsCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          </View>
          {METHODS.map((m, i) => {
            const isSelected = method === m.id;
            return (
              <Pressable
                key={m.id}
                style={[styles.methodRow, i > 0 && !isSelected && styles.methodRowDivider, isSelected && styles.methodRowSelected]}
                onPress={() => setMethod(m.id)}
                testID={`method-${m.id}`}
              >
                <View style={[styles.methodIcon, isSelected && styles.methodIconSelected]}>
                  <Ionicons name={m.icon} size={18} color={isSelected ? DesignColors.primaryBright : DesignColors.onSurfaceVariant} />
                </View>
                <View style={styles.methodBody}>
                  <Text style={styles.methodTitle}>{m.title}</Text>
                  <Text style={styles.methodSubtitle}>{m.subtitle}</Text>
                </View>
                {isSelected && m.id === 'card' && <Text style={styles.maskedCard}>•••• 4821</Text>}
                <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={isSelected ? DesignColors.primaryBright : DesignColors.outline} />
              </Pressable>
            );
          })}
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
        {locallyExpired && (
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
  listingMiniInfo: { flex: 1, gap: 2 },
  listingMiniSub: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1.2 },
  listingMiniTitle: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  listingMiniMeta: { ...DesignTypography.labelSm, color: DesignColors.primaryBright, fontFamily, fontWeight: '600' },
  amountCard: { backgroundColor: DesignColors.primaryTint, borderWidth: 1, borderColor: DesignColors.primaryTintBorder, borderRadius: DesignRadius.xl, padding: DesignSpacing.lg, gap: DesignSpacing.xs },
  amountValue: { ...DesignTypography.headlineLg, color: DesignColors.primaryBright, fontFamily, fontWeight: '800', fontSize: 34 },
  amountDivider: { height: 1, backgroundColor: DesignColors.primaryTintBorder, marginVertical: DesignSpacing.sm },
  amountNote: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20 },
  methodsCard: { backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.xl, borderWidth: 1, borderColor: DesignColors.borderFaint, padding: DesignSpacing.md, gap: DesignSpacing.sm },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, padding: DesignSpacing.md, borderRadius: DesignRadius.lg },
  methodRowDivider: { borderTopWidth: 1, borderTopColor: DesignColors.borderFaint, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  methodRowSelected: { backgroundColor: DesignColors.primaryTint, borderWidth: 1, borderColor: DesignColors.primaryTintBorder },
  methodIcon: { width: 40, height: 40, borderRadius: DesignRadius.md, backgroundColor: DesignColors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  methodIconSelected: { backgroundColor: DesignColors.surface, borderWidth: 1, borderColor: DesignColors.primaryTintBorder },
  methodBody: { flex: 1 },
  methodTitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  methodSubtitle: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  maskedCard: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, fontVariant: ['tabular-nums'] },
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
