import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { generateInviteCode } from '@/services/liquidity-pod-service';
import { useAppToast } from '@/components/ui/toast-card';
import { copyTextToClipboard } from '@/utils/clipboard';
import type { ManageGroupMember } from '@/dummy/group-members-mock';

type Props = {
  visible: boolean;
  groupCode: string;
  members: ManageGroupMember[];
  onClose: () => void;
};

const STATUS_LABELS: Record<ManageGroupMember['status'], string> = {
  you: 'You',
  pending: 'Invited',
  accepted: 'Accepted',
  paid: 'Paid',
};

export function ManageGroupModal({ visible, groupCode, members, onClose }: Props) {
  const [code, setCode] = useState(groupCode);
  const [roster, setRoster] = useState<ManageGroupMember[]>(members);
  const { showToast } = useAppToast();

  useEffect(() => {
    if (!visible) return;
    setCode(groupCode);
    setRoster(members);
  }, [visible, groupCode, members]);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onClose]);

  const handleCopy = async () => {
    const copied = await copyTextToClipboard(code);
    showToast({ message: copied ? `Code copied: ${code}` : `Share this code: ${code}`, type: 'success' });
  };

  const handleRegenerate = () => {
    setCode(generateInviteCode());
    showToast({ message: 'New code generated — the old one no longer works.', type: 'success' });
  };

  const handleKick = (member: ManageGroupMember) => {
    setRoster((prev) => prev.filter((item) => item.id !== member.id));
    showToast({ message: `${member.name} was removed from the group.`, type: 'success' });
  };

  const canKick = (member: ManageGroupMember) => member.status !== 'you' && member.status !== 'paid';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="manage-group-backdrop">
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage Group</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={DesignColors.onSurfaceVariant} />
            </Pressable>
          </View>

          <View style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <Text style={styles.codeLabel}>GROUP CODE</Text>
              <Pressable onPress={handleRegenerate} hitSlop={8}>
                <Text style={styles.regenerateText}>Regenerate</Text>
              </Pressable>
            </View>
            <View style={styles.codeRow}>
              <View style={styles.codeBadge}>
                <Ionicons name="link-outline" size={16} color={DesignColors.primaryBright} />
                <Text style={styles.codeValue}>{code}</Text>
              </View>
              <Pressable style={styles.copyBtn} onPress={handleCopy}>
                <Ionicons name="copy-outline" size={16} color={DesignColors.onPrimary} />
                <Text style={styles.copyText}>Copy</Text>
              </Pressable>
            </View>
            <Text style={styles.codeHint}>Whoever applies with this code joins as a referred roommate.</Text>
          </View>

          <Text style={styles.sectionLabel}>MEMBERS ({roster.length})</Text>
          <ScrollView style={styles.memberList} bounces={false}>
            {roster.map((member) => {
              const kickable = canKick(member);
              return (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Ionicons name="person" size={16} color={DesignColors.primaryBright} />
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <View style={styles.memberMeta}>
                      <View style={[styles.statusChip, STATUS_STYLES[member.status]]}>
                        <Text style={styles.statusText}>{STATUS_LABELS[member.status]}</Text>
                      </View>
                      <Text style={styles.viaText}>{member.via === 'code' ? 'via code' : 'direct'}</Text>
                    </View>
                  </View>
                  <Pressable
                    style={[styles.kickBtn, !kickable && styles.kickBtnDisabled]}
                    onPress={() => handleKick(member)}
                    disabled={!kickable}
                    hitSlop={6}
                    testID={`kick-${member.id}`}
                  >
                    <Ionicons name="person-remove-outline" size={18} color={DesignColors.error} />
                  </Pressable>
                </View>
              );
            })}
            <Text style={styles.lockHint}>Paid members are locked in — they can only leave by mutual agreement.</Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: DesignColors.scrimHeavy, justifyContent: 'center', alignItems: 'center', padding: DesignSpacing.lg },
  dialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: DesignColors.surface,
    borderRadius: DesignRadius.lg,
    padding: DesignSpacing.lg,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    gap: DesignSpacing.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontWeight: '800', fontFamily },
  codeCard: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    padding: DesignSpacing.md,
    gap: DesignSpacing.sm,
  },
  codeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  regenerateText: { fontSize: 12, fontWeight: '700', color: DesignColors.primaryBright, fontFamily },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: DesignSpacing.sm },
  codeBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.surfaceContainerLowest,
    borderRadius: DesignRadius.sm,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    paddingHorizontal: DesignSpacing.sm + 2,
    paddingVertical: DesignSpacing.sm,
  },
  codeValue: {
    flex: 1,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DesignColors.primary,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    borderRadius: DesignRadius.full,
  },
  copyText: { fontSize: 13, fontWeight: '700', color: DesignColors.onPrimary, fontFamily },
  codeHint: { fontSize: 12, lineHeight: 17, color: DesignColors.onSurfaceVariant, fontFamily },
  sectionLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  memberList: { gap: DesignSpacing.sm },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    paddingHorizontal: DesignSpacing.sm + 2,
    paddingVertical: DesignSpacing.sm + 2,
    marginBottom: DesignSpacing.sm,
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: { flex: 1, gap: 4 },
  memberName: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  memberMeta: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  statusChip: {
    paddingHorizontal: DesignSpacing.sm,
    paddingVertical: 2,
    borderRadius: DesignRadius.full,
  },
  status_you: { backgroundColor: DesignColors.primaryContainer },
  status_pending: { backgroundColor: DesignColors.warningContainer },
  status_accepted: { backgroundColor: DesignColors.infoContainer },
  status_paid: { backgroundColor: DesignColors.successContainer },
  statusText: { fontSize: 10, fontWeight: '700', color: DesignColors.onSurfaceVariant, fontFamily },
  viaText: { fontSize: 10, color: DesignColors.outline, fontFamily },
  kickBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.errorContainer,
  },
  kickBtnDisabled: { opacity: 0.3 },
  lockHint: { fontSize: 11, lineHeight: 15, color: DesignColors.outline, fontFamily, textAlign: 'center', paddingTop: 2 },
});

const STATUS_STYLES: Record<ManageGroupMember['status'], object> = {
  you: styles.status_you,
  pending: styles.status_pending,
  accepted: styles.status_accepted,
  paid: styles.status_paid,
};
