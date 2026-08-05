import React, { useState, useCallback } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BackButton } from '@/components/ui/back-button';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { useListing } from '@/hooks/use-listing';
import { useCreateSlotCredit } from '@/hooks/use-liquidity';
import { IntentSelector } from './intent-selector';
import { ClaimRulesCard } from './claim-rules-card';
import { ClaimSplitSummary } from './claim-split-summary';
import { calculateSplitAmount } from '@/utils/liquidity-math';

export function ClaimRoomScreen({ listingId }: { listingId: string }) {
  const { profile } = useAuth();
  const { data: detail, isLoading: listingLoading } = useListing(listingId);
  const { mutateAsync: purchaseSlot, isPending: isPurchasing } = useCreateSlotCredit();
  const { showToast } = useAppToast();

  const [selectedIntent, setSelectedIntent] = useState<number>(1);

  const dbListing = detail?.dbListing;
  const listing = detail?.listing;
  const priceAmount = dbListing?.price_amount ?? 1200000;
  const bedrooms = (dbListing?.number_of_bedrooms && dbListing.number_of_bedrooms > 0 && dbListing.number_of_bedrooms <= 8) ? dbListing.number_of_bedrooms : null;
  const rawMax = bedrooms ?? dbListing?.max_roommates ?? 4;
  const propertyTier: number = dbListing?.property_tier ?? ((rawMax > 0 && rawMax < 10) ? rawMax : 4);
  const rules = dbListing?.rules ?? ['No smoking indoors', 'Quiet hours after 10 PM'];

  const splitPrice = calculateSplitAmount(priceAmount, selectedIntent, propertyTier);

  const handleSecureSpace = useCallback(async () => {
    try {
      await purchaseSlot({ estateId: listingId, propertyTier, intentSize: selectedIntent });
      showToast({ message: 'Slot reserved! Welcome to the Matching Lobby.', type: 'success' });
      router.push('/property/lobby' as any);
    } catch (error: any) {
      showToast({ message: error.message || 'Failed to reserve slot.', type: 'error' });
    }
  }, [listingId, propertyTier, selectedIntent, purchaseSlot]);

  if (listingLoading) {
    return <SafeAreaView style={styles.safe}><ActivityIndicator size="large" color={DesignColors.primary} style={styles.center} /></SafeAreaView>;
  }
  if (!listing && !dbListing) {
    return <SafeAreaView style={styles.safe}><Text style={styles.errorText}>Listing unavailable.</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <BackButton hasBackground={false} />
        <Text style={styles.topBarTitle}>Reserve Space & Join Pool</Text>
      </View>
      <ScrollView bounces={false} contentContainerStyle={styles.content}>
        <View style={styles.listingMini}>
          {(dbListing?.primary_image || listing?.image) && (
            <Image source={{ uri: dbListing?.primary_image || listing?.image }} style={styles.listingThumb} />
          )}
          <View style={styles.listingMiniInfo}>
            <Text style={styles.listingMiniTitle} numberOfLines={1}>{listing?.title || 'Gida Prestige Estate'}</Text>
            <Text style={styles.listingMiniPrice}>Tier {propertyTier} Property • ₦{priceAmount.toLocaleString()}/yr</Text>
          </View>
        </View>

        <IntentSelector propertyTier={propertyTier} selectedIntent={selectedIntent} onSelectIntent={setSelectedIntent} />
        <ClaimSplitSummary totalPrice={splitPrice} numberOfPeople={1} />
        <ClaimRulesCard rules={rules} maxRoommates={propertyTier} />

        <Pressable
          style={[styles.lockButton, isPurchasing && styles.lockButtonDisabled]}
          onPress={handleSecureSpace}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator size="small" color={DesignColors.onPrimaryContainer} />
          ) : (
            <Text style={styles.lockText}>Confirm & Enter Matching Lobby</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surface },
  center: { flex: 1, alignSelf: 'center' },
  errorText: { ...DesignTypography.bodyLg, color: DesignColors.error, textAlign: 'center', marginTop: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, paddingHorizontal: DesignSpacing.md, paddingVertical: DesignSpacing.sm },
  topBarTitle: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  content: { padding: DesignSpacing.md, paddingBottom: 60, gap: DesignSpacing.md },
  listingMini: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.md, padding: DesignSpacing.sm, borderWidth: 1, borderColor: DesignColors.cardBorder },
  listingThumb: { width: 56, height: 56, borderRadius: DesignRadius.sm },
  listingMiniInfo: { flex: 1, gap: 2 },
  listingMiniTitle: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  listingMiniPrice: { ...DesignTypography.bodyMd, color: DesignColors.primaryBright, fontFamily, fontWeight: '600' },
  lockButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primaryContainer, borderRadius: DesignRadius.xl, paddingVertical: 16, marginTop: DesignSpacing.sm },
  lockButtonDisabled: { opacity: 0.5 },
  lockText: { ...DesignTypography.bodyLg, color: DesignColors.onPrimaryContainer, fontFamily, fontWeight: '700' },
});
