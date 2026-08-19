import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAppToast } from '@/components/ui/toast-card';
import { useActivePods } from '@/hooks/use-liquidity';
import { inviteRoommateToPod } from '@/services/liquidity-service';
import { copyTextToClipboard } from '@/utils/clipboard';
import { ManageGroupModal } from '@/components/lobby/manage-group-modal';
import { RoommateInviteModal } from '@/components/lobby/roommate-invite-modal';
import type { ManageGroupMember } from '@/dummy/group-members-mock';
import type { SlotCredit } from '@/types/liquidity';

interface Props {
  credit: SlotCredit;
}

export function ReservationManagementCard({ credit }: Props) {
  const { showToast } = useAppToast();
  const { data: pods, refetch: refetchPods } = useActivePods();
  const [inviteVisible, setInviteVisible] = useState(false);
  const [manageVisible, setManageVisible] = useState(false);

  const activePod = pods?.[0];
  const targetTier = credit.target_occupancy;
  const currentTotalIntent = activePod?.current_total_intent ?? 1;
  const remainingSlots = Math.max(0, targetTier - currentTotalIntent);
  const inviteCode = credit.invite_code ?? 'GIDA-GRP-DEV';

  const groupMembers: ManageGroupMember[] = (activePod?.members ?? []).map((m) => ({
    id: m.user_id,
    name: m.user_id === credit.user_id ? 'You' : (m.profile?.full_name || m.full_name || 'Roommate'),
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

  const handleCopyCode = async () => {
    const copied = await copyTextToClipboard(inviteCode);
    showToast({ message: copied ? `Code copied: ${inviteCode}` : `Share this code: ${inviteCode}`, type: 'success' });
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

  const isSolo = credit.target_occupancy === 1;
  if (isSolo) return null;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="people-outline" size={20} color={DesignColors.primaryBright} />
          <Text style={styles.title}>Your Group</Text>
          <Text style={styles.badge}>
            {currentTotalIntent}/{targetTier}
          </Text>
        </View>

        <Text style={styles.description}>
          {remainingSlots > 0
            ? `${remainingSlots} spot${remainingSlots === 1 ? '' : 's'} remaining. Invite friends or share your code before you pay.`
            : 'All spots filled! Your group is complete.'}
        </Text>

        <View style={styles.codeRow}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeLabel}>GROUP CODE</Text>
            <Text style={styles.codeValue} numberOfLines={1}>{inviteCode}</Text>
          </View>
          <Pressable style={styles.copyBtn} onPress={handleCopyCode} testID="copy-group-code">
            <Ionicons name="copy-outline" size={14} color={DesignColors.onPrimary} />
            <Text style={styles.copyText}>Copy</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          {remainingSlots > 0 && (
            <Pressable style={styles.actionBtn} onPress={() => setInviteVisible(true)} testID="invite-friend-btn">
              <Ionicons name="person-add-outline" size={16} color={DesignColors.onPrimaryContainer} />
              <Text style={styles.actionText}>Invite Friend</Text>
            </Pressable>
          )}
          <Pressable style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => setManageVisible(true)} testID="manage-group-btn">
            <Ionicons name="settings-outline" size={16} color={DesignColors.onSurface} />
            <Text style={styles.actionTextSecondary}>Manage Group</Text>
          </Pressable>
        </View>
      </View>

      <RoommateInviteModal
        visible={inviteVisible}
        onClose={() => setInviteVisible(false)}
        onSubmitInvite={handleInvite}
      />
      <ManageGroupModal
        visible={manageVisible}
        groupCode={inviteCode}
        members={groupMembers}
        maxCapacity={targetTier}
        onInvite={handleInvite}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  title: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontWeight: '700', fontFamily, flex: 1 },
  badge: {
    ...DesignTypography.labelSm,
    color: DesignColors.onPrimaryContainer,
    backgroundColor: DesignColors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: DesignRadius.full,
    fontWeight: '700',
    overflow: 'hidden',
  },
  description: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, lineHeight: 20 },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DesignColors.glassFill,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
    padding: DesignSpacing.sm,
  },
  codeBadge: { flex: 1, gap: 2 },
  codeLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontSize: 9 },
  codeValue: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '800', letterSpacing: 0.8 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DesignColors.primary,
    paddingHorizontal: DesignSpacing.sm + 2,
    paddingVertical: 6,
    borderRadius: DesignRadius.full,
  },
  copyText: { fontSize: 11, fontWeight: '700', color: DesignColors.onPrimary, fontFamily },
  actions: { flexDirection: 'row', gap: DesignSpacing.sm, marginTop: 2 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: DesignColors.glassSoft,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
    paddingVertical: 10,
    borderRadius: DesignRadius.md,
  },
  actionBtnSecondary: { borderColor: DesignColors.borderMedium },
  actionText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimaryContainer, fontWeight: '700', fontFamily, fontSize: 13 },
  actionTextSecondary: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '700', fontFamily, fontSize: 13 },
});
