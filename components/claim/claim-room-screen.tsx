import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { BackButton } from '@/components/ui/back-button';
import { ClaimRulesCard } from '@/components/claim/claim-rules-card';
import { ClaimSplitSummary } from '@/components/claim/claim-split-summary';
import { IntentSelector } from '@/components/claim/intent-selector';
import { RoommateLinkCard } from '@/components/claim/roommate-link-card';
import { useListing } from '@/hooks/use-listing';
import { useAppToast } from '@/components/ui/toast-card';
import { calculateSplitAmount, isValidIntentSize } from '@/utils/liquidity-math';
import { useCreateSlotCredit } from '@/hooks/use-liquidity';

export function ClaimRoomScreen({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { data: detail, isLoading: listingLoading } = useListing(listingId);
  const { mutateAsync: purchaseSlot, isPending: isPurchasing } = useCreateSlotCredit();
  const { showToast } = useAppToast();

  const [selectedIntent, setSelectedIntent] = useState<number>(1);
  const [matchingMode, setMatchingMode] = useState<'open_pool' | 'friends'>('open_pool');
  const [isSeparateBilling, setIsSeparateBilling] = useState<boolean>(false);
  const [friendCode, setFriendCode] = useState<string>('');

  const dbListing = detail?.dbListing;
  const listing = detail?.listing;
  const priceAmount = dbListing?.price_amount ?? 1200000;
  const bedrooms = (dbListing?.number_of_bedrooms && dbListing.number_of_bedrooms > 0 && dbListing.number_of_bedrooms <= 8) ? dbListing.number_of_bedrooms : null;
  const rawMax = bedrooms ?? dbListing?.max_roommates ?? 4;
  const propertyTier: number = dbListing?.property_tier ?? ((rawMax > 0 && rawMax < 10) ? rawMax : 4);
  const rules = dbListing?.rules ?? ['No smoking indoors', 'Quiet hours after 10 PM'];

  const isFriendMode = matchingMode === 'friends';

  const handleModeChange = (newMode: 'open_pool' | 'friends') => {
    setMatchingMode(newMode);
    if (newMode === 'open_pool') {
      setIsSeparateBilling(false);
      setFriendCode('');
      if (!isValidIntentSize(propertyTier, selectedIntent, false)) {
        setSelectedIntent(1);
        showToast({ message: 'Reset to 1 slot to comply with solo odd-tier fairness rules.', type: 'info' });
      }
    }
  };

  const handleIntentChange = (newIntent: number) => {
    setSelectedIntent(newIntent);
    if (newIntent <= 1) {
      setIsSeparateBilling(false);
    }
  };

  const splitPrice = calculateSplitAmount(priceAmount, selectedIntent, propertyTier, isFriendMode);
  const billingPayers = (isSeparateBilling && selectedIntent > 1 && isFriendMode) ? selectedIntent : 1;

  const handleSecureSpace = useCallback(async () => {
    try {
      await purchaseSlot({ estateId: listingId, propertyTier, intentSize: selectedIntent });
      if (friendCode.trim() && isFriendMode) {
        showToast({ message: `Linked directly to pod ${friendCode.toUpperCase()}!`, type: 'success' });
      } else if (isSeparateBilling && selectedIntent > 1 && isFriendMode) {
        showToast({ message: `Reserved ${selectedIntent} slots with separate billing! Share Pod Code in lobby.`, type: 'success' });
      } else {
        showToast({ message: 'Slot reserved! Welcome to the Matching Lobby.', type: 'success' });
      }
      router.push('/property/lobby' as any);
    } catch (error: any) {
      showToast({ message: error.message || 'Failed to reserve slot.', type: 'error' });
    }
  }, [listingId, propertyTier, selectedIntent, purchaseSlot, friendCode, isSeparateBilling, isFriendMode, showToast, router]);

  if (listingLoading) {
    return <SafeAreaView style={styles.safe}><ActivityIndicator size="large" color={DesignColors.primary} style={styles.center} /></SafeAreaView>;
  }
  if (!listing && !dbListing) {
    return <SafeAreaView style={styles.safe}><Text style={styles.errorText}>Listing unavailable.</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
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

          {propertyTier > 1 && (
            <RoommateLinkCard
              matchingMode={matchingMode}
              onChangeMatchingMode={handleModeChange}
              intentSize={selectedIntent}
              isSeparateBilling={isSeparateBilling}
              onToggleSeparateBilling={setIsSeparateBilling}
              friendCode={friendCode}
              onChangeFriendCode={setFriendCode}
              propertyTier={propertyTier}
            />
          )}

          <IntentSelector propertyTier={propertyTier} selectedIntent={selectedIntent} onSelectIntent={handleIntentChange} isFriendMode={isFriendMode} />
          <ClaimSplitSummary totalPrice={splitPrice} numberOfPeople={billingPayers} />

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
      </KeyboardAvoidingView>
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
