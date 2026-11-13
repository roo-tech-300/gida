import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { useAdminLodgeDetail, useAcceptLodgeReservation, useRejectLodgeReservation } from '@/hooks/use-admin-lodge-reservations';
import { useAppToast } from '@/components/ui/toast-card';
import { notifyUserOfDecision } from '@/services/lodge-reservation-notify';

import { styles } from './lodge-reservation-detail-screen.styles';
import { MembersCard, PodInfoCard, PropertyCard } from '@/components/admin/lodge-reservation-detail-cards';

export function LodgeReservationDetailScreen({ podId }: { podId: string }) {
  const { profile } = useAuth();
  const { data: detail, isError, isLoading, isRefetching, refetch } = useAdminLodgeDetail(podId);
  const acceptMutation = useAcceptLodgeReservation();
  const rejectMutation = useRejectLodgeReservation();
  const { showToast } = useAppToast();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const notifyAllMembers = useCallback(async (decision: 'accepted' | 'rejected', reason?: string) => {
    if (!detail || !profile?.id || !detail.listing?.id) return;
    for (const member of detail.members) {
      try {
        await notifyUserOfDecision({
          adminId: profile.id,
          userId: member.userId,
          listingId: detail.listing.id,
          podId: detail.pod.id,
          decision,
          reason,
        });
      } catch (err) {
        console.error('[LodgeDetail] Failed to notify member:', member.userId, err);
      }
    }
  }, [detail, profile]);

  const handleAccept = useCallback(async () => {
    if (!detail) return;
    const ok = await acceptMutation.mutateAsync(detail.pod.id);
    if (ok) {
      await notifyAllMembers('accepted');
      showToast({ message: 'Approved. Everyone in the household can now pay.', type: 'success' });
      router.back();
    } else {
      showToast({ message: 'Could not approve this request. Please try again.', type: 'error' });
    }
  }, [detail, acceptMutation, showToast, notifyAllMembers]);

  const handleReject = useCallback(async () => {
    if (!detail || !rejectReason.trim()) return;
    const ok = await rejectMutation.mutateAsync({ podId: detail.pod.id, reason: rejectReason.trim() });
    if (ok) {
      await notifyAllMembers('rejected', rejectReason.trim());
      showToast({ message: 'Declined. The household has been told why.', type: 'success' });
      setRejectModalOpen(false);
      setRejectReason('');
      router.back();
    } else {
      showToast({ message: 'Could not decline this request. Please try again.', type: 'error' });
    }
  }, [detail, rejectReason, rejectMutation, showToast, notifyAllMembers]);

  const isPending = detail?.pod.verificationStatus === 'pending_verification';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton} hitSlop={8}>
          <Ionicons name="close" size={22} color={DesignColors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Request</Text>
        <View style={styles.closeButton} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={DesignColors.primary} />
        </View>
      ) : isError || !detail ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={28} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.errorTitle}>Could not load this application</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={DesignColors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <PropertyCard detail={detail} />
          <PodInfoCard detail={detail} />
          <MembersCard members={detail.members} targetOccupancy={detail.pod.targetOccupancy} />

          {isPending && (
            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.rejectButton, (rejectMutation.isPending || acceptMutation.isPending) && styles.buttonDisabled]}
                onPress={() => setRejectModalOpen(true)}
                disabled={rejectMutation.isPending || acceptMutation.isPending}
              >
                <Ionicons name="close-circle-outline" size={18} color={DesignColors.error} />
                <Text style={styles.rejectText}>Decline</Text>
              </Pressable>
              <Pressable
                style={[styles.acceptButton, (rejectMutation.isPending || acceptMutation.isPending) && styles.buttonDisabled]}
                onPress={handleAccept}
                disabled={rejectMutation.isPending || acceptMutation.isPending}
              >
                {acceptMutation.isPending ? (
                  <ActivityIndicator size="small" color={DesignColors.onPrimary} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color={DesignColors.onPrimary} />
                    <Text style={styles.acceptText}>Approve</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {detail.pod.verificationStatus === 'rejected' && detail.pod.rejectionReason && (
            <View style={styles.rejectionCard}>
              <Ionicons name="close-circle-outline" size={18} color={DesignColors.error} />
              <View style={styles.rejectionBody}>
                <Text style={styles.rejectionLabel}>Rejection reason</Text>
                <Text style={styles.rejectionReason}>{detail.pod.rejectionReason}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {rejectModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Decline request</Text>
            <Text style={styles.modalSubtitle}>Tell the household why. They will see this reason.</Text>
            <TextInput
              style={styles.modalInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="e.g. Room no longer available, policy violation..."
              placeholderTextColor={DesignColors.onSurfaceVariant}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => { setRejectModalOpen(false); setRejectReason(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirm, !rejectReason.trim() && styles.buttonDisabled]}
                onPress={handleReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <ActivityIndicator size="small" color={DesignColors.onPrimary} />
                ) : (
                  <Text style={styles.modalConfirmText}>Decline</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
