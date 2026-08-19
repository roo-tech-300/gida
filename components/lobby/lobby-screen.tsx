import { useState, useCallback } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors } from '@/constants/design';
import { useActivePods, usePhysicalRoom, useUserSlotCredits } from '@/hooks/use-liquidity';
import { removeMemberFromPod, inviteRoommateToPod } from '@/services/liquidity-service';
import { useAppToast } from '@/components/ui/toast-card';
import { ClaimCountdown } from '@/components/claim/claim-countdown';
import { SlotPass } from './slot-pass';
import { LobbyMemberList } from './lobby-member-list';
import { InlineInviteSearch } from './inline-invite-search';
import { ManageGroupModal } from './manage-group-modal';
import type { ManageGroupMember } from '@/dummy/group-members-mock';
import { styles } from './lobby-screen.styles';

export function LobbyScreen() {
  const router = useRouter();
  const { data: credits, refetch: refetchCredits, isError } = useUserSlotCredits();
  const { data: pods, refetch: refetchPods } = useActivePods();
  const [refreshing, setRefreshing] = useState(false);
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const { showToast } = useAppToast();

  useFocusEffect(useCallback(() => {
    refetchCredits();
    refetchPods();
  }, [refetchCredits, refetchPods]));

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
        {isPaid && (
          <View style={styles.heroCard}>
            <View style={styles.heroIconCircle}>
              <Ionicons name="checkmark" size={28} color={DesignColors.onPrimary} />
            </View>
            <Text style={styles.heroTitle}>Payment confirmed</Text>
            <Text style={styles.heroDesc}>
              {isSolo ? 'Your spot is locked in.' : 'You have paid for your slot, waiting on your roomates.'}
            </Text>
            {roomLabel && (
              <View style={styles.heroRoomRow}>
                <Ionicons name="key-outline" size={16} color={DesignColors.primaryBright} />
                <Text style={styles.heroRoomText}>{roomLabel}</Text>
              </View>
            )}
          </View>
        )}

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

        <SlotPass credit={credit} isSolo={isSolo} joinedCount={currentTotalIntent} />

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

        {!isSolo && (
          <LobbyMemberList members={groupMembers} targetTier={targetTier} />
        )}

        {!isSolo && remainingSlots > 0 && (
          <InlineInviteSearch remainingSlots={remainingSlots} onSelect={handleInvite} />
        )}

        {!isPaid && (isSolo || remainingSlots === 0) && activePod?.is_finalized && roomLabel && (
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
