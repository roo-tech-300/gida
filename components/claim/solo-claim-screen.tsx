import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { BackButton } from '@/components/ui/back-button';
import { useAppToast } from '@/components/ui/toast-card';
import { useListing } from '@/hooks/use-listing';
import { useCreateSlotCredit } from '@/hooks/use-liquidity';
import { notifyAdminOfReservation } from '@/services/lodge-reservation-notify';
import { calculateBaseRent } from '@/utils/liquidity-math';

const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-US')}`;

export function SoloClaimScreen({ listingId }: { listingId: string }) {
  const { data: detail, isLoading } = useListing(listingId);
  const { mutateAsync: purchaseSlot, isPending: isReserving } = useCreateSlotCredit();
  const { showToast } = useAppToast();

  const dbListing = detail?.dbListing;
  const listing = detail?.listing;
  const priceAmount = dbListing?.price_amount ?? 1200000;

  const handleReserve = useCallback(async () => {
    if (!dbListing) return;
    console.log('[SoloClaim] 1. Button clicked — starting reservation flow');
    console.log('[SoloClaim] 2. dbListing.id:', dbListing.id, 'price:', dbListing.price_amount);
    try {
      console.log('[SoloClaim] 3. Calling purchaseSlot...');
      const { credit, synced } = await purchaseSlot({ listing: dbListing, targetOccupancy: 1 });
      console.log('[SoloClaim] 4. purchaseSlot returned — credit.id:', credit.id, 'synced:', synced, 'status:', credit.status);
      showToast({ message: 'Application submitted for admin review.', type: 'success' });
      if (!synced) {
        showToast({ message: "Reserved locally — couldn't sync to the server. Sign in to persist your spot.", type: 'error' });
      }
      console.log('[SoloClaim] 5. Calling notifyAdminOfReservation...');
      try {
        await notifyAdminOfReservation({ creditId: credit.id, listingId: dbListing.id, userName: 'A resident' });
        console.log('[SoloClaim] 8. notifyAdminOfReservation completed successfully');
      } catch (notifyErr) {
        console.error('[SoloClaim] 8. notifyAdminOfReservation FAILED:', notifyErr);
      }
      router.back();
    } catch (error) {
      console.error('[SoloClaim] ERROR in handleReserve:', error);
      const message = error instanceof Error ? error.message : 'Failed to reserve spot.';
      showToast({ message, type: 'error' });
    }
  }, [dbListing, purchaseSlot, showToast]);

  const price = calculateBaseRent(priceAmount, 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <BackButton hasBackground={false} />
        <Text style={styles.topBarTitle}>Single Occupancy</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
        </View>
      ) : !dbListing ? (
        <View style={styles.center}>
          <View style={styles.errorBadge}>
            <Ionicons name="alert-circle-outline" size={32} color={DesignColors.error} />
          </View>
          <Text style={styles.mutedText}>Listing unavailable.</Text>
        </View>
      ) : (
        <>
          <ScrollView bounces={false} contentContainerStyle={styles.content}>
            <View style={styles.heroBadge}>
              <Ionicons name="person-outline" size={40} color={DesignColors.primaryBright} />
            </View>
            <Text style={styles.title}>This property is single occupancy</Text>
            <Text style={styles.subtitle}>
              Only one tenant can stay in this property — no roommates, no group join. You&apos;ll be reserving this spot just for yourself.
            </Text>

            <View style={styles.listingCard}>
              {(dbListing.primary_image || listing?.image) && (
                <Image source={{ uri: dbListing.primary_image || listing?.image }} style={styles.listingThumb} />
              )}
              <View style={styles.listingInfo}>
                <Text style={styles.listingSub}>RESIDENCE</Text>
                <Text style={styles.listingTitle} numberOfLines={1}>{listing?.title || 'Gida Property'}</Text>
                <Text style={styles.listingMeta}>Solo · 1 slot · {formatNaira(priceAmount)}/yr</Text>
              </View>
            </View>

            <View style={styles.costCard}>
              <View style={styles.costRow}>
                <Text style={styles.costTotal}>Your Price</Text>
                <Text style={styles.costTotalValue}>{formatNaira(price)}/yr</Text>
              </View>
            </View>

            <View style={styles.noticeCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionBar} />
                <Text style={styles.sectionLabel}>GOOD TO KNOW</Text>
              </View>
              <View style={styles.noticeRow}>
                <Ionicons name="person-outline" size={18} color={DesignColors.primaryBright} />
                <Text style={styles.noticeText}>The whole spot is yours alone</Text>
              </View>
              <View style={styles.noticeRow}>
                <Ionicons name="link-outline" size={18} color={DesignColors.primaryBright} />
                <Text style={styles.noticeText}>No invite codes or roommate matching</Text>
              </View>
              <View style={styles.noticeRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color={DesignColors.primaryBright} />
                <Text style={styles.noticeText}>Admin will review before you can pay</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.primaryButton, isReserving && styles.primaryButtonDisabled]}
              onPress={handleReserve}
              disabled={isReserving}
              testID="solo-reserve-btn"
            >
              {isReserving ? (
                <ActivityIndicator size="small" color={DesignColors.onPrimaryContainer} />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={16} color={DesignColors.onPrimaryContainer} />
                  <Text style={styles.primaryText}>Submit Reservation</Text>
                </>
              )}
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surface },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, paddingHorizontal: DesignSpacing.md, paddingVertical: DesignSpacing.sm },
  topBarTitle: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700', fontSize: 17 },
  content: { padding: DesignSpacing.md, paddingBottom: DesignSpacing.xl, gap: DesignSpacing.lg, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.md, padding: DesignSpacing.lg },
  footer: { padding: DesignSpacing.md, paddingTop: DesignSpacing.xs },
  mutedText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20, textAlign: 'center' },
  heroBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: DesignColors.primaryTint, borderWidth: 6, borderColor: DesignColors.primaryTintBorder, alignItems: 'center', justifyContent: 'center' },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, fontWeight: '800', textAlign: 'center', fontSize: 22, lineHeight: 28 },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 22, textAlign: 'center' },
  listingCard: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.lg, borderWidth: 1, borderColor: DesignColors.borderFaint, padding: DesignSpacing.md, alignSelf: 'stretch' },
  listingThumb: { width: 56, height: 56, borderRadius: DesignRadius.md, backgroundColor: DesignColors.surfaceContainerHigh },
  listingInfo: { flex: 1, gap: 2 },
  listingSub: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1.2 },
  listingTitle: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  listingMeta: { ...DesignTypography.labelSm, color: DesignColors.primaryBright, fontFamily, fontWeight: '600' },
  costCard: { backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.lg, borderWidth: 1, borderColor: DesignColors.borderFaint, padding: DesignSpacing.md, gap: DesignSpacing.sm, alignSelf: 'stretch' },
  costRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  costTotal: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  costTotalValue: { ...DesignTypography.bodyLg, color: DesignColors.primaryBright, fontFamily, fontWeight: '800' },
  noticeCard: { backgroundColor: DesignColors.primaryTint, borderWidth: 1, borderColor: DesignColors.primaryTintBorder, borderRadius: DesignRadius.lg, padding: DesignSpacing.md, gap: DesignSpacing.md, alignSelf: 'stretch' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  sectionBar: { width: 3, height: 14, borderRadius: 2, backgroundColor: DesignColors.primaryBright },
  sectionLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1.4 },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md },
  noticeText: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, flex: 1 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: DesignColors.primaryContainer, borderRadius: DesignRadius.full, paddingVertical: 16 },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryText: { ...DesignTypography.bodyLg, color: DesignColors.onPrimaryContainer, fontFamily, fontWeight: '700' },
  errorBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: DesignColors.errorContainer, alignItems: 'center', justifyContent: 'center' },
});
