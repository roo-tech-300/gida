import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useActivePods, useUserSlotCredits } from '@/hooks/use-liquidity';
import { useAppToast } from '@/components/ui/toast-card';
import { ClaimCountdown } from '@/components/claim/claim-countdown';
import { SlotPass } from './slot-pass';
import { PodStatusCard } from './pod-status-card';
import { PeerCard } from './peer-card';
import { RoommateInviteCard } from './roommate-invite-card';
import { RoommateInviteModal } from './roommate-invite-modal';
import { MOCK_LOBBY_PEERS, MOCK_PHYSICAL_ROOMS } from '@/dummy/liquidity-mock';
import { inviteRoommateToPod } from '@/services/liquidity-service';

export function LobbyScreen() {
  const router = useRouter();
  const { data: credits, refetch: refetchCredits, isError } = useUserSlotCredits();
  const { data: pods, refetch: refetchPods } = useActivePods();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { showToast } = useAppToast();

  const credit = credits?.[0];
  const activePod = pods?.[0];
  const targetTier = credit?.property_tier ?? 4;
  const currentTotalIntent = activePod?.current_total_intent ?? credit?.intent_size ?? 1;
  const remainingSlots = Math.max(0, targetTier - currentTotalIntent);
  const room = activePod?.is_finalized ? MOCK_PHYSICAL_ROOMS[0].physical_door_number : null;
  const isPendingPayment = credit?.status === 'booked_pending_claim';
  const isExpiredCredit = credit?.status === 'expired';

  const compatiblePeers = useMemo(() => {
    if (remainingSlots <= 0) return [];
    return MOCK_LOBBY_PEERS.filter((p) => p.intent_size <= remainingSlots);
  }, [remainingSlots]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCredits(), refetchPods()]);
    setTimeout(() => setRefreshing(false), 1300);
  };

  const handleInvite = (_peerId: string) => {
    showToast({ message: `Invite sent! If accepted, your pod will progress towards minting.`, type: 'success' });
  };

  const handleRoommateSubmit = async (studentId: string) => {
    try {
      await inviteRoommateToPod(activePod?.id, studentId);
      await refetchPods();
      showToast({ message: `Separate billing invite dispatched to ${studentId}!`, type: 'success' });
    } catch (e: any) {
      showToast({ message: e?.message || 'Failed to send invite.', type: 'error' });
    }
  };

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Failed to load matching lobby state.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']} testID="lobby-screen-safe-area">
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={DesignColors.primaryBright} />}
      >
        <Text style={styles.screenTitle}>ROOMMATE MATCHING & CONFIRMATION</Text>
        <SlotPass credit={credit} />
        {isPendingPayment && credit && (
          <View style={styles.paymentCard}>
            <Ionicons name="card-outline" size={20} color={DesignColors.tertiary} />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Payment required to confirm your spot</Text>
              <ClaimCountdown expiresAt={credit.payment_deadline} variant="inline" />
            </View>
            <Pressable style={styles.payNowButton} onPress={() => router.push({ pathname: '/property/pay-slot', params: { id: credit.id } })} testID="lobby-pay-now">
              <Text style={styles.payNowText}>Pay Now</Text>
            </Pressable>
          </View>
        )}
        {isExpiredCredit && (
          <View style={styles.expiredCard}>
            <Ionicons name="time-outline" size={20} color={DesignColors.error} />
            <View style={styles.paymentInfo}>
              <Text style={styles.expiredTitle}>Your hold expired</Text>
              <Text style={styles.expiredDesc}>Make a fresh reservation to restart your 24-hour window.</Text>
            </View>
            <Pressable style={styles.payNowButton} onPress={() => router.push('/explore')} testID="lobby-view-properties">
              <Text style={styles.payNowText}>View Properties</Text>
            </Pressable>
          </View>
        )}
        <PodStatusCard pod={activePod} targetTier={targetTier} physicalDoor={room} paymentDeadline={credit?.payment_deadline} />
        
        {remainingSlots > 0 ? (
          <>
            <View style={{ gap: 4 }}>
              <Text style={styles.sectionHeader}>COMPATIBLE PEERS IN LOBBY ({compatiblePeers.length})</Text>
              <Text style={styles.peerSubtitle}>We are matching your remaining {remainingSlots} slot(s) with verified peers below based on study habits and cleanliness. All residents contribute equal share per slot.</Text>
            </View>
            <View style={styles.list}>
              {compatiblePeers.map((peer) => (
                <PeerCard key={peer.user_id} peer={peer} onInvite={handleInvite} />
              ))}
              {compatiblePeers.length === 0 && (
                <Text style={styles.emptyText}>No compatible peers currently match your exact remaining slot capacity ({remainingSlots} slot{remainingSlots === 1 ? '' : 's'}).</Text>
              )}
            </View>
            <RoommateInviteCard
              inviteCode={credit?.invite_code ?? 'GIDA-GRP-4921'}
              remainingSlots={remainingSlots}
              onOpenInviteModal={() => setModalVisible(true)}
            />
          </>
        ) : (
          <View style={styles.completedCard}>
            <Text style={styles.completedTitle}>Apartment Group at 100% Capacity</Text>
            <Text style={styles.completedDesc}>
              All slots in this property are filled and verified. Your physical room and door number are officially confirmed and locked in!
            </Text>
          </View>
        )}

      </ScrollView>
      
      <RoommateInviteModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmitInvite={handleRoommateSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DesignColors.surface },
  content: { padding: DesignSpacing.md, gap: DesignSpacing.lg, paddingBottom: 40 },
  screenTitle: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontWeight: '800', fontFamily },
  sectionHeader: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, marginTop: DesignSpacing.sm, fontFamily },
  peerSubtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, lineHeight: 20, marginBottom: 8 },
  list: { gap: DesignSpacing.md },
  emptyText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  completedCard: { backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.md, padding: DesignSpacing.lg, borderWidth: 1, borderColor: DesignColors.primaryBright, gap: DesignSpacing.sm },
  completedTitle: { ...DesignTypography.headlineMd, color: DesignColors.primaryBright, fontWeight: '800', fontFamily },
  completedDesc: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, lineHeight: 20 },
  errorText: { ...DesignTypography.bodyLg, color: DesignColors.error, textAlign: 'center', marginTop: 40 },
  paymentCard: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, backgroundColor: DesignColors.surfaceContainerHigh, borderRadius: DesignRadius.md, borderWidth: 1, borderColor: DesignColors.tertiary, padding: DesignSpacing.md },
  paymentInfo: { flex: 1, gap: 4 },
  paymentTitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  expiredTitle: { ...DesignTypography.bodyMd, color: DesignColors.error, fontWeight: '700', fontFamily },
  expiredDesc: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 16 },
  payNowButton: { backgroundColor: DesignColors.primaryContainer, borderRadius: DesignRadius.xl, paddingHorizontal: DesignSpacing.md, paddingVertical: 10 },
  payNowText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimaryContainer, fontWeight: '700', fontFamily },
  expiredCard: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, backgroundColor: DesignColors.errorContainer, borderRadius: DesignRadius.md, borderWidth: 1, borderColor: DesignColors.error, padding: DesignSpacing.md },
});

