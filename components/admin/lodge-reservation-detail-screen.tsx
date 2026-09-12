import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { useAdminLodgeDetail, useAcceptLodgeReservation, useRejectLodgeReservation } from '@/hooks/use-admin-lodge-reservations';
import { useAppToast } from '@/components/ui/toast-card';
import { notifyUserOfDecision } from '@/services/lodge-reservation-notify';
import type { AdminLodgeDetail, AdminLodgeMember } from '@/services/admin-lodge-verification-service';

const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-US')}`;

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
      showToast({ message: 'Pod accepted. All members can now proceed to payment.', type: 'success' });
      router.back();
    } else {
      showToast({ message: 'Failed to accept pod. Try again.', type: 'error' });
    }
  }, [detail, acceptMutation, showToast, notifyAllMembers]);

  const handleReject = useCallback(async () => {
    if (!detail || !rejectReason.trim()) return;
    const ok = await rejectMutation.mutateAsync({ podId: detail.pod.id, reason: rejectReason.trim() });
    if (ok) {
      await notifyAllMembers('rejected', rejectReason.trim());
      showToast({ message: 'Pod rejected.', type: 'success' });
      setRejectModalOpen(false);
      setRejectReason('');
      router.back();
    } else {
      showToast({ message: 'Failed to reject pod. Try again.', type: 'error' });
    }
  }, [detail, rejectReason, rejectMutation, showToast, notifyAllMembers]);

  const isPending = detail?.pod.verificationStatus === 'pending_verification';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton} hitSlop={8}>
          <Ionicons name="close" size={22} color={DesignColors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Pod application</Text>
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
                <Text style={styles.rejectText}>Reject</Text>
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
                    <Text style={styles.acceptText}>Accept</Text>
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
            <Text style={styles.modalTitle}>Reject Pod</Text>
            <Text style={styles.modalSubtitle}>Provide a reason for rejecting this pod application.</Text>
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
                  <Text style={styles.modalConfirmText}>Reject</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function PropertyCard({ detail }: { detail: AdminLodgeDetail }) {
  const listing = detail.listing;

  return (
    <View style={[styles.card, styles.propertyCard]}>
      {listing?.primaryImage ? (
        <Image source={{ uri: listing.primaryImage }} style={styles.propertyImage} />
      ) : (
        <View style={styles.propertyImageFallback}>
          <Ionicons name="home-outline" size={30} color={DesignColors.primaryBright} />
        </View>
      )}
      <View style={styles.propertyBody}>
        <Text style={styles.propertyTitle} numberOfLines={2}>
          {listing?.title ?? 'Unnamed property'}
        </Text>
        {listing?.location ? (
          <Text style={styles.propertyMeta} numberOfLines={1}>
            {listing.location}
          </Text>
        ) : null}
        {listing ? <Text style={styles.propertyPrice}>{formatNaira(listing.priceAmount)}/yr</Text> : null}
      </View>
    </View>
  );
}

function PodInfoCard({ detail }: { detail: AdminLodgeDetail }) {
  const pod = detail.pod;
  const ref = `GIDA-POD-${pod.id.slice(-4).toUpperCase()}`;

  return (
    <View style={styles.card}>
      <InfoRow icon="ticket-outline" label="Reference" value={ref} />
      <InfoRow icon="people-outline" label="Target occupancy" value={`${pod.targetOccupancy} ${pod.targetOccupancy === 1 ? 'person' : 'people'}`} />
      <InfoRow icon="person-outline" label="Members applied" value={`${pod.memberCount} of ${pod.targetOccupancy}`} />
      <InfoRow icon="time-outline" label="Submitted" value={formatCreatedDate(pod.createdAt)} />
    </View>
  );
}

function MembersCard({ members, targetOccupancy }: { members: AdminLodgeMember[]; targetOccupancy: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Members ({members.length} of {targetOccupancy})</Text>
      {members.length === 0 ? (
        <Text style={styles.emptyMembers}>No members yet</Text>
      ) : (
        members.map((member) => (
          <MemberRow key={member.userId} member={member} />
        ))
      )}
    </View>
  );
}

function MemberRow({ member }: { member: AdminLodgeMember }) {
  const name = member.userName ?? 'Unknown';
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <View style={styles.memberRow}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>{initial}</Text>
      </View>
      <View style={styles.memberBody}>
        <Text style={styles.memberName}>{name}</Text>
        {member.amountPaid != null && (
          <Text style={styles.memberAmount}>{formatNaira(member.amountPaid)}</Text>
        )}
      </View>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={DesignColors.onSurfaceVariant} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function formatCreatedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.borderSoft,
  },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.md, padding: DesignSpacing.lg },
  errorTitle: { ...DesignTypography.titleMd, color: DesignColors.onSurface, fontFamily, textAlign: 'center' },
  retryButton: {
    paddingHorizontal: DesignSpacing.lg,
    paddingVertical: 10,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primary,
  },
  retryText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimary, fontFamily, fontWeight: '600' },
  content: { padding: DesignSpacing.marginMobile, gap: DesignSpacing.md, paddingBottom: DesignSpacing.xl * 2 },
  card: {
    backgroundColor: DesignColors.glassFill,
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.lg,
    gap: DesignSpacing.md,
  },
  propertyCard: { flexDirection: 'row', alignItems: 'center' },
  propertyImage: {
    width: 72,
    height: 72,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainer,
  },
  propertyImageFallback: {
    width: 72,
    height: 72,
    borderRadius: DesignRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  propertyBody: { flex: 1, gap: 4 },
  propertyTitle: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  propertyMeta: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  propertyPrice: { ...DesignTypography.headlineMd, color: DesignColors.primaryBright, fontFamily, fontWeight: '700' },
  sectionTitle: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  emptyMembers: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  memberAvatarText: { ...DesignTypography.bodyMd, color: DesignColors.primaryBright, fontFamily, fontWeight: '700' },
  memberBody: { flex: 1, gap: 2 },
  memberName: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  memberAmount: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.borderSoft,
  },
  rowLabel: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, flex: 1 },
  rowValue: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row',
    gap: DesignSpacing.md,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    borderColor: DesignColors.error,
    backgroundColor: DesignColors.errorContainer,
  },
  rejectText: { ...DesignTypography.bodyMd, color: DesignColors.error, fontFamily, fontWeight: '700' },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primary,
  },
  acceptText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimary, fontFamily, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  rejectionCard: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.errorContainer,
    borderWidth: 1,
    borderColor: DesignColors.error,
  },
  rejectionBody: { flex: 1, gap: 4 },
  rejectionLabel: { ...DesignTypography.labelSm, color: DesignColors.error, fontFamily, fontWeight: '700' },
  rejectionReason: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, lineHeight: 22 },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modalContent: {
    width: '85%',
    backgroundColor: DesignColors.surfaceContainerLowest,
    borderRadius: DesignRadius.xl,
    padding: DesignSpacing.lg,
    gap: DesignSpacing.md,
  },
  modalTitle: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  modalSubtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  modalInput: {
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    borderRadius: DesignRadius.lg,
    padding: DesignSpacing.md,
    minHeight: 80,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  modalActions: { flexDirection: 'row', gap: DesignSpacing.md, justifyContent: 'flex-end' },
  modalCancel: {
    paddingHorizontal: DesignSpacing.lg,
    paddingVertical: 10,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.borderSoft,
  },
  modalCancelText: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  modalConfirm: {
    paddingHorizontal: DesignSpacing.lg,
    paddingVertical: 10,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.error,
  },
  modalConfirmText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimary, fontFamily, fontWeight: '700' },
});
