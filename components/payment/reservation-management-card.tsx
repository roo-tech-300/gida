import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAppToast } from '@/components/ui/toast-card';
import { useActivePods } from '@/hooks/use-liquidity';
import { inviteRoommateToPod } from '@/services/liquidity-service';
import { ManageGroupModal } from '@/components/lobby/manage-group-modal';
import type { ManageGroupMember } from '@/dummy/group-members-mock';
import type { SlotCredit } from '@/types/liquidity';

interface Props {
  credit: SlotCredit;
}

export function ReservationManagementCard({ credit }: Props) {
  const { showToast } = useAppToast();
  const { data: pods, isLoading: podsLoading, isError: podsError, refetch: refetchPods } = useActivePods();
  const [manageVisible, setManageVisible] = useState(false);

  const groupLoading = podsLoading || pods === undefined;

  const activePod = pods?.[0];  const targetTier = credit.target_occupancy;
  const realMembers = (activePod?.members ?? []).filter((m) => m.slot_credit_id !== 'invitation');
  const filled = realMembers.length;
  const remaining = Math.max(0, targetTier - filled);
  const inviteCode = credit.invite_code ?? 'GIDA-GRP-DEV';
  const isCreator = !!activePod && activePod.members[0]?.user_id === credit.user_id;

  const groupMembers: ManageGroupMember[] = (activePod?.members ?? []).map((m) => ({
    id: m.user_id,
    name: m.profile?.full_name || m.full_name || 'Roommate',
    status: (m.user_id === credit.user_id
      ? 'you'
      : m.slot_credit_id === 'invitation'
        ? 'pending'
        : m.amount_paid
          ? 'paid'
          : 'accepted') as ManageGroupMember['status'],
    via: (m.slot_credit_id === 'invitation' ? 'code' : 'direct') as ManageGroupMember['via'],
    avatar_url: m.profile?.avatar_url ?? m.avatar_url,
  }));

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

  const isSolo = credit.target_occupancy === 1;
  if (isSolo) return null;

  const countText = groupLoading
    ? null
    : podsError
      ? 'Could not load group'
      : `${filled} of ${targetTier} slots${remaining > 0 ? ` — ${remaining} left` : ''}`;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.labelGroup}>
            <Ionicons name="people-outline" size={16} color={DesignColors.primaryBright} />
            <Text style={styles.label}>Your Group</Text>
          </View>
          {groupLoading ? (
            <View style={styles.countLoading}>
              <ActivityIndicator size="small" color={DesignColors.primary} />
              <Text style={styles.slotCount}>Loading group…</Text>
            </View>
          ) : (
            <Text style={[styles.slotCount, podsError && styles.slotCountError]}>{countText}</Text>
          )}
        </View>

        <View style={styles.progressTrack}>
          {!groupLoading && !podsError ? (
            <View style={[styles.progressFill, { width: `${Math.min(100, (filled / targetTier) * 100)}%` }]} />
          ) : null}
        </View>

        <Pressable style={styles.manageBtn} onPress={() => setManageVisible(true)} testID="manage-group-btn">
          <Ionicons name={isCreator ? 'settings-outline' : 'eye-outline'} size={15} color={DesignColors.onPrimaryContainer} />
          <Text style={styles.manageBtnText}>{isCreator ? 'Manage Group' : 'See Group'}</Text>
          <Ionicons name="chevron-forward" size={14} color={DesignColors.onSurfaceVariant} />
        </Pressable>
      </View>

      <ManageGroupModal
        visible={manageVisible}
        groupCode={inviteCode}
        members={groupMembers}
        maxCapacity={targetTier}
        editable={isCreator}
        loading={podsLoading}
        onInvite={isCreator ? handleInvite : undefined}
        onClose={() => setManageVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DesignColors.glassSoft,
    borderRadius: DesignRadius.xl,
    padding: DesignSpacing.md,
    borderWidth: 1,
    borderColor: DesignColors.glassBorder,
    gap: DesignSpacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontWeight: '700',
    fontFamily,
  },
  slotCount: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  slotCountError: {
    color: DesignColors.error,
  },
  countLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.xs,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: DesignColors.borderSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: DesignColors.primaryBright,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
    paddingVertical: 10,
    paddingHorizontal: DesignSpacing.sm,
    borderRadius: DesignRadius.md,
  },
  manageBtnText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontWeight: '600',
    fontFamily,
    flex: 1,
  },
});
