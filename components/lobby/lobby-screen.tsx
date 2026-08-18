import { useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useActivePods, usePhysicalRoom, useUserSlotCredits } from '@/hooks/use-liquidity';
import { removeMemberFromPod, inviteRoommateToPod } from '@/services/liquidity-service';
import { useAppToast } from '@/components/ui/toast-card';
import { ClaimCountdown } from '@/components/claim/claim-countdown';
import { SlotPass } from './slot-pass';
import { LobbyMemberList } from './lobby-member-list';
import { RoommateInviteCard } from './roommate-invite-card';
import { ManageGroupModal } from './manage-group-modal';
import type { ManageGroupMember } from '@/dummy/group-members-mock';

export function LobbyScreen() {
  const router = useRouter();
  const { data: credits, refetch: refetchCredits, isError } = useUserSlotCredits();
  const { data: pods, refetch: refetchPods } = useActivePods();
  const [refreshing, setRefreshing] = useState(false);
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const { showToast } = useAppToast();

  const credit = credits?.[0];
  const activePod = pods?.[0];
  const targetTier = credit?.target_occupancy ?? 1;
  const isSolo = targetTier === 1;
  const currentTotalIntent = activePod?.current_total_intent ?? credit?.intent_size ?? 1;
  const remainingSlots = Math.max(0, targetTier - currentTotalIntent);
  const isPendingPayment = credit?.status === 'booked_pending_claim';
  const isExpiredCredit = credit?.status === 'expired';
  const isPaid = credit?.status === 'paid_unmatched' || credit?.status === 'matched';

  const { data: physicalRoom } = usePhysicalRoom(activePod?.physical_room_id);
  const roomLabel = physicalRoom?.physical_door_number ?? activePod?.physical_room_id ?? null;

  const estateName = credit?.estate?.name || 'Campus Residence';
  const estateImage = credit?.estate?.primary_image;

  const groupMembers: ManageGroupMember[] = (activePod?.members ?? []).map((member) => ({
    id: member.user_id,
    name: member.user_id === credit?.user_id ? 'You' : (member.profile?.full_name || member.full_name || 'Roommate'),
    status: (member.user_id === credit?.user_id
      ? 'you'
      : member.slot_credit_id === 'invitation'
        ? 'pending'
        : member.amount_paid
          ? 'paid'
          : 'accepted') as ManageGroupMember['status'],
    via: (member.slot_credit_id === 'invitation' ? 'code' : 'direct') as ManageGroupMember['via'],
    avatar_url: member.profile?.avatar_url ?? member.avatar_url,
  }));

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCredits(), refetchPods()]);
    setTimeout(() => setRefreshing(false), 1300);
  };

  const handleKickMember = async (member: ManageGroupMember) => {
    if (!activePod?.id) throw new Error('No active pod found.');
    await removeMemberFromPod(activePod.id, member.id);
    await refetchPods();
  };

  const handleInvite = async (name: string, userId?: string) => {
    try {
      await inviteRoommateToPod(activePod?.id, name, userId);
      await refetchPods();
      showToast({ message: `Invite sent to ${name}!`, type: 'success' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to send invite.';
      showToast({ message, type: 'error' });
    }
  };

  if (isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={DesignColors.onSurface} />
          </Pressable>
          <Text style={styles.topBarTitle}>Your Lobby</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={DesignColors.error} />
          <Text style={styles.errorText}>Failed to load your lobby data.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={DesignColors.onSurface} />
        </Pressable>
        <Text style={styles.topBarTitle}>Your Lobby</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={DesignColors.primaryBright} />}
        bounces={false}
      >
        <View style={styles.estateCard}>
          {estateImage ? (
            <Image source={{ uri: estateImage }} style={styles.estateImage} />
          ) : (
            <View style={styles.estateImagePlaceholder}>
              <Ionicons name="home-outline" size={28} color={DesignColors.primaryBright} />
            </View>
          )}
          <View style={styles.estateInfo}>
            <Text style={styles.estateName} numberOfLines={1}>{estateName}</Text>
            <Text style={styles.estateMeta}>{targetTier} slot{targetTier === 1 ? '' : 's'} • {currentTotalIntent} confirmed</Text>
          </View>
        </View>

        <SlotPass credit={credit} isSolo={isSolo} />

        {isPendingPayment && credit && (
          <View style={styles.bannerCard}>
            <View style={styles.bannerIcon}>
              <Ionicons name="card-outline" size={18} color={DesignColors.tertiary} />
            </View>
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerTitle}>Payment required</Text>
              <ClaimCountdown expiresAt={credit.payment_deadline} variant="inline" />
            </View>
            <Pressable style={styles.bannerAction} onPress={() => router.push({ pathname: '/property/pay-slot', params: { id: credit.id } })}>
              <Text style={styles.bannerActionText}>Pay</Text>
            </Pressable>
          </View>
        )}

        {isExpiredCredit && (
          <View style={[styles.bannerCard, styles.bannerExpired]}>
            <View style={[styles.bannerIcon, styles.bannerExpiredIcon]}>
              <Ionicons name="time-outline" size={18} color={DesignColors.error} />
            </View>
            <View style={styles.bannerInfo}>
              <Text style={[styles.bannerTitle, styles.bannerExpiredTitle]}>Hold expired</Text>
              <Text style={styles.bannerDesc}>Reserve again to restart the window.</Text>
            </View>
            <Pressable style={[styles.bannerAction, styles.bannerExpiredAction]} onPress={() => router.push('/explore')}>
              <Text style={styles.bannerExpiredActionText}>View</Text>
            </Pressable>
          </View>
        )}

        {isPaid && (
          <View style={[styles.bannerCard, styles.bannerSuccess]}>
            <View style={[styles.bannerIcon, styles.bannerSuccessIcon]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={DesignColors.secondary} />
            </View>
            <View style={styles.bannerInfo}>
              <Text style={[styles.bannerTitle, styles.bannerSuccessTitle]}>Payment confirmed</Text>
              <Text style={styles.bannerDesc}>{isSolo ? 'Your spot is locked in.' : 'Your group is forming — invite roommates to fill remaining slots.'}</Text>
            </View>
          </View>
        )}

        {!isSolo && (
          <LobbyMemberList members={groupMembers} targetTier={targetTier} />
        )}

        {!isSolo && remainingSlots > 0 && (
          <RoommateInviteCard
            inviteCode={credit?.invite_code ?? ''}
            remainingSlots={remainingSlots}
            onOpenInviteModal={() => setManageModalVisible(true)}
          />
        )}

        {(isSolo || remainingSlots === 0) && activePod?.is_finalized && roomLabel && (
          <View style={styles.roomCard}>
            <Ionicons name="key-outline" size={20} color={isSolo ? DesignColors.primaryBright : DesignColors.secondary} />
            <View style={styles.roomInfo}>
              <Text style={styles.roomLabel}>{isSolo ? 'YOUR ROOM' : 'ASSIGNED ROOM'}</Text>
              <Text style={styles.roomValue}>{roomLabel}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <ManageGroupModal
        visible={manageModalVisible}
        groupCode={credit?.invite_code ?? ''}
        members={groupMembers}
        maxCapacity={targetTier}
        onInvite={handleInvite}
        onKick={handleKickMember}
        onClose={() => setManageModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surface },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, paddingHorizontal: DesignSpacing.md, paddingVertical: DesignSpacing.sm },
  topBarTitle: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700', fontSize: 17 },
  content: { padding: DesignSpacing.md, gap: DesignSpacing.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.md },
  errorText: { ...DesignTypography.bodyMd, color: DesignColors.error, fontFamily },
  estateCard: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.lg, borderWidth: 1, borderColor: DesignColors.cardBorder, padding: DesignSpacing.md },
  estateImage: { width: 56, height: 56, borderRadius: DesignRadius.md },
  estateImagePlaceholder: { width: 56, height: 56, borderRadius: DesignRadius.md, backgroundColor: DesignColors.primaryTint, borderWidth: 1, borderColor: DesignColors.primaryTintBorder, alignItems: 'center', justifyContent: 'center' },
  estateInfo: { flex: 1, gap: 2 },
  estateName: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  estateMeta: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  bannerCard: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, backgroundColor: DesignColors.surfaceContainerHigh, borderRadius: DesignRadius.md, borderWidth: 1, borderColor: DesignColors.tertiary, padding: DesignSpacing.md },
  bannerIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: DesignColors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  bannerInfo: { flex: 1, gap: 2 },
  bannerTitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '700', fontFamily, fontSize: 13 },
  bannerDesc: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 15 },
  bannerAction: { backgroundColor: DesignColors.primaryContainer, paddingHorizontal: DesignSpacing.md, paddingVertical: 8, borderRadius: DesignRadius.full },
  bannerActionText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimaryContainer, fontWeight: '700', fontFamily, fontSize: 13 },
  bannerExpired: { borderColor: DesignColors.error, backgroundColor: DesignColors.errorContainer },
  bannerExpiredIcon: { backgroundColor: DesignColors.errorContainer },
  bannerExpiredTitle: { color: DesignColors.error },
  bannerExpiredAction: { backgroundColor: DesignColors.error },
  bannerExpiredActionText: { color: DesignColors.onError, fontWeight: '700', fontSize: 13, fontFamily },
  bannerSuccess: { borderColor: DesignColors.secondary, backgroundColor: DesignColors.successContainer },
  bannerSuccessIcon: { backgroundColor: DesignColors.successContainer },
  bannerSuccessTitle: { color: DesignColors.secondary },
  roomCard: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.md, borderWidth: 1, borderColor: DesignColors.secondary, padding: DesignSpacing.md },
  roomInfo: { flex: 1, gap: 2 },
  roomLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1.2 },
  roomValue: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, fontWeight: '800' },
});
