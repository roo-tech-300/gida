import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { generateInviteCode } from '@/services/liquidity-pod-service';
import { useAppToast } from '@/components/ui/toast-card';
import { copyTextToClipboard } from '@/utils/clipboard';
import { InlineInviteSearch } from '@/components/lobby/inline-invite-search';
import { GroupMemberRow } from '@/components/lobby/group-member-row';
import type { ManageGroupMember } from '@/dummy/group-members-mock';

type Props = {
  visible: boolean;
  groupCode: string;
  members: ManageGroupMember[];
  maxCapacity?: number;
  onInvite?: (name: string, userId?: string) => void;
  onKick?: (member: ManageGroupMember) => Promise<void>;
  onClose: () => void;
};

export function ManageGroupModal({ visible, groupCode, members, maxCapacity, onInvite, onKick, onClose }: Props) {
  const [code, setCode] = useState(groupCode);
  const [roster, setRoster] = useState<ManageGroupMember[]>(members);
  const { showToast } = useAppToast();
  const remainingSlots = maxCapacity != null ? Math.max(0, maxCapacity - roster.length) : 0;

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
    showToast({ message: copied ? `Copied to clipboard` : `Share this code: ${code}`, type: 'success' });
  };

  const handleRegenerate = () => {
    setCode(generateInviteCode());
    showToast({ message: 'New code generated — the old one no longer works.', type: 'success' });
  };

  const handleKick = async (member: ManageGroupMember) => {
    try {
      if (onKick) await onKick(member);
      setRoster((prev) => prev.filter((item) => item.id !== member.id));
      showToast({ message: `${member.name} was removed from the group.`, type: 'success' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to remove member.';
      showToast({ message, type: 'error' });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="manage-group-backdrop">
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="people-outline" size={20} color={DesignColors.primaryBright} />
              </View>
              <View>
                <Text style={styles.title}>Manage Group</Text>
                <Text style={styles.subtitle}>{roster.length} member{roster.length === 1 ? '' : 's'}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={DesignColors.onSurfaceVariant} />
            </Pressable>
          </View>

          <View style={styles.codeCard}>
            <View style={styles.codeTop}>
              <Text style={styles.codeLabel}>GROUP CODE</Text>
              <Pressable onPress={handleRegenerate} hitSlop={8}>
                <Text style={styles.regenerateText}>Regenerate</Text>
              </Pressable>
            </View>
            <View style={styles.codeRow}>
              <Text style={styles.codeValue} numberOfLines={1}>{code}</Text>
              <Pressable style={styles.copyBtn} onPress={handleCopy}>
                <Ionicons name="copy-outline" size={14} color={DesignColors.onPrimary} />
                <Text style={styles.copyText}>Copy</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.sectionLabel}>MEMBERS</Text>
          <ScrollView style={styles.memberList} bounces={false} showsVerticalScrollIndicator={false}>
            {roster.map((member) => (
              <GroupMemberRow key={member.id} member={member} onKick={handleKick} />
            ))}
            {roster.length === 0 && (
              <Text style={styles.emptyText}>No members yet. Share your group code to get started.</Text>
            )}
          </ScrollView>

          {remainingSlots > 0 && onInvite && (
            <InlineInviteSearch
              remainingSlots={remainingSlots}
              onSelect={(name, userId) => {
                onInvite(name, userId);
                onClose();
              }}
            />
          )}

          <Text style={styles.lockHint}>Paid members are locked in and cannot be removed.</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: DesignColors.scrimHeavy, justifyContent: 'center', alignItems: 'center', padding: DesignSpacing.lg },
  dialog: { width: '100%', maxWidth: 400, maxHeight: '75%', backgroundColor: DesignColors.surface, borderRadius: DesignRadius.xl, borderWidth: 1, borderColor: DesignColors.cardBorder, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: DesignSpacing.lg, paddingBottom: DesignSpacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: DesignColors.primaryTint, borderWidth: 1, borderColor: DesignColors.primaryTintBorder, alignItems: 'center', justifyContent: 'center' },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontWeight: '800', fontFamily },
  subtitle: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: DesignColors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  codeCard: { marginHorizontal: DesignSpacing.lg, backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.lg, borderWidth: 1, borderColor: DesignColors.primaryTintBorder, padding: DesignSpacing.md, gap: DesignSpacing.sm },
  codeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1.2 },
  regenerateText: { fontSize: 12, fontWeight: '700', color: DesignColors.primaryBright, fontFamily },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  codeValue: { flex: 1, ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, fontWeight: '800', letterSpacing: 1 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: DesignColors.primary, paddingHorizontal: DesignSpacing.md, paddingVertical: 8, borderRadius: DesignRadius.full },
  copyText: { fontSize: 12, fontWeight: '700', color: DesignColors.onPrimary, fontFamily },
  sectionLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, paddingHorizontal: DesignSpacing.lg, paddingTop: DesignSpacing.md, paddingBottom: DesignSpacing.xs, letterSpacing: 1.2 },
  memberList: { paddingHorizontal: DesignSpacing.lg, maxHeight: 300 },
  lockHint: { ...DesignTypography.labelSm, color: DesignColors.outline, fontFamily, textAlign: 'center', paddingHorizontal: DesignSpacing.lg, paddingVertical: DesignSpacing.md },
  emptyText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center', paddingVertical: DesignSpacing.lg, fontStyle: 'italic' },
});
