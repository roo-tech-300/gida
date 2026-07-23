import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { useClaimDetails, useCreateClaim, useAddRoommate } from '@/hooks/use-claim';
import { useListing } from '@/hooks/use-listing';
import { ClaimRulesCard } from './claim-rules-card';
import { ClaimSplitSummary } from './claim-split-summary';
import { ClaimStatusCard } from './claim-status-card';
import { RoommateSearch } from './roommate-search';

type Profile = { id: string; full_name: string | null };

export function ClaimRoomScreen({ listingId }: { listingId: string }) {
  const { profile } = useAuth();
  const userId = profile?.id;
  const { data: detail, isLoading: listingLoading } = useListing(listingId);
  const dbListing = detail?.dbListing;
  const listing = detail?.listing;
  const { mutateAsync: createClaim, isPending: isCreating } = useCreateClaim();
  const { mutateAsync: addRoommate, isPending: isAddingRoommate } = useAddRoommate();

  const [hasRoommate, setHasRoommate] = useState(false);
  const [selectedRoommate, setSelectedRoommate] = useState<Profile | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const [createdClaimId, setCreatedClaimId] = useState<string | null>(null);

  const priceAmount = dbListing?.price_amount ?? 0;
  const maxRoommates = dbListing?.max_roommates ?? 1;
  const rules = dbListing?.rules ?? [];
  const numberOfPeople = hasRoommate && selectedRoommate ? 2 : 1;

  const { data: claimDetails } = useClaimDetails(createdClaimId);

  const handleLockSpace = useCallback(async () => {
    if (!userId || !listingId) return;

    const splitAmount = hasRoommate && selectedRoommate
      ? Math.ceil(priceAmount / 2)
      : priceAmount;

    try {
      const claim = await createClaim({ listingId, splitAmount });
      if (hasRoommate && selectedRoommate) {
        await addRoommate({
          applicationId: claim.id,
          studentId: selectedRoommate.id,
          splitAmount: Math.ceil(priceAmount / 2),
        });
      }
      setCreatedClaimId(claim.id);
      setShowStatus(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to lock space.');
    }
  }, [userId, listingId, hasRoommate, selectedRoommate, priceAmount, createClaim, addRoommate]);

  const handlePayNow = useCallback(() => {
    Alert.alert('Payment', 'Payment integration coming soon.');
  }, []);

  if (listingLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Listing not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showStatus && claimDetails) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <BackButton hasBackground={false} />
          <Text style={styles.topBarTitle}>Claim Status</Text>
        </View>
        <ScrollView bounces={false} contentContainerStyle={styles.content}>
          <View style={styles.listingMini}>
            {(dbListing?.primary_image || listing?.image) && (
              <Image source={{ uri: dbListing?.primary_image || listing?.image }} style={styles.listingThumb} />
            )}
            <View style={styles.listingMiniInfo}>
              <Text style={styles.listingMiniTitle} numberOfLines={1}>{listing?.title}</Text>
              <Text style={styles.listingMiniPrice}>₦{priceAmount.toLocaleString('en-US')}</Text>
            </View>
          </View>

          <ClaimStatusCard
            expiresAt={claimDetails.lock_expires_at}
            roommates={claimDetails.application_roommates}
            currentUserId={userId!}
            onPayNow={handlePayNow}
            onExpired={() => setShowStatus(false)}
            onFindNewRoommate={() => { setShowStatus(false); setHasRoommate(true); setSelectedRoommate(null); }}
          />

          <Pressable style={styles.backToListing} onPress={() => router.replace(`/property/${listingId}`)}>
            <Text style={styles.backToListingText}>Back to listing</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <BackButton hasBackground={false} />
        <Text style={styles.topBarTitle}>Claim Room</Text>
      </View>

      <ScrollView bounces={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.listingMini}>
            {(dbListing?.primary_image || listing?.image) && (
              <Image source={{ uri: dbListing?.primary_image || listing?.image }} style={styles.listingThumb} />
            )}
            <View style={styles.listingMiniInfo}>
              <Text style={styles.listingMiniTitle} numberOfLines={1}>{listing?.title}</Text>
              <Text style={styles.listingMiniPrice}>₦{priceAmount.toLocaleString('en-US')}</Text>
            </View>
          </View>

          <View style={styles.toggleSection}>
          <Text style={styles.toggleLabel}>Do you have a roommate on Gida?</Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleBtn, !hasRoommate && styles.toggleBtnActive]}
              onPress={() => { setHasRoommate(false); setSelectedRoommate(null); }}
            >
              <Ionicons name="person" size={18} color={!hasRoommate ? DesignColors.onPrimaryContainer : DesignColors.onSurfaceVariant} />
              <Text style={[styles.toggleBtnText, !hasRoommate && styles.toggleBtnTextActive]}>No, solo</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, hasRoommate && styles.toggleBtnActive]}
              onPress={() => setHasRoommate(true)}
            >
              <Ionicons name="people" size={18} color={hasRoommate ? DesignColors.onPrimaryContainer : DesignColors.onSurfaceVariant} />
              <Text style={[styles.toggleBtnText, hasRoommate && styles.toggleBtnTextActive]}>Yes, with roommate</Text>
            </Pressable>
          </View>
        </View>

        {hasRoommate && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Find your roommate</Text>
            <RoommateSearch
              selectedRoommate={selectedRoommate}
              onSelect={setSelectedRoommate}
              onClear={() => setSelectedRoommate(null)}
            />
          </View>
        )}

        <ClaimSplitSummary totalPrice={priceAmount} numberOfPeople={numberOfPeople} />
        <ClaimRulesCard rules={rules} maxRoommates={maxRoommates} />

        <Pressable
          style={[styles.lockButton, (isCreating || isAddingRoommate) && styles.lockButtonDisabled]}
          onPress={handleLockSpace}
          disabled={isCreating || isAddingRoommate || (hasRoommate && !selectedRoommate)}
        >
          {isCreating || isAddingRoommate ? (
            <ActivityIndicator size="small" color={DesignColors.onPrimaryContainer} />
          ) : (
            <>
              <Text style={styles.lockText}>
                {hasRoommate ? 'Send Invite & Secure Space' : 'Secure Space'}
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...DesignTypography.bodyLg, color: DesignColors.onSurfaceVariant, fontFamily },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.sm,
  },
  topBarTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  content: {
    padding: DesignSpacing.marginMobile,
    paddingBottom: DesignSpacing.xl * 2,
    gap: DesignSpacing.lg,
  },
  listingMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.sm,
  },
  listingThumb: {
    width: 56,
    height: 56,
    borderRadius: DesignRadius.sm,
  },
  listingMiniInfo: {
    flex: 1,
    gap: 2,
  },
  listingMiniTitle: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  listingMiniPrice: {
    ...DesignTypography.bodyMd,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '600',
  },
  toggleSection: {
    gap: DesignSpacing.sm,
  },
  toggleLabel: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  toggleBtnActive: {
    backgroundColor: DesignColors.primaryContainer,
    borderColor: DesignColors.primaryBright,
  },
  toggleBtnText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: DesignColors.onPrimaryContainer,
  },
  section: {
    gap: DesignSpacing.sm,
  },
  sectionLabel: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.xl,
    paddingVertical: 16,
  },
  lockButtonDisabled: {
    opacity: 0.5,
  },
  lockText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
  backToListing: {
    alignItems: 'center',
    paddingVertical: DesignSpacing.sm,
  },
  backToListingText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '600',
  },
});
