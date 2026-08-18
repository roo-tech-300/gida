import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { ManageGroupMember } from '@/dummy/group-members-mock';

const AVATAR_COLORS = [
  DesignColors.primaryContainer,
  '#E8D5F5',
  '#D5EEF5',
  '#F5E6D5',
  '#D5F5E6',
  '#F5D5E0',
];

function getInitials(name: string): string {
  const safe = name ?? '';
  const parts = safe.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return safe.slice(0, 2).toUpperCase() || '??';
}

function getAvatarColor(name: string): string {
  const safe = name ?? '';
  let hash = 0;
  for (let i = 0; i < safe.length; i++) {
    hash = safe.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

const STATUS_CONFIG: Record<ManageGroupMember['status'], { label: string; bg: string; icon: string }> = {
  you: { label: 'You', bg: DesignColors.primaryContainer, icon: 'person' },
  pending: { label: 'Invited', bg: DesignColors.warningContainer, icon: 'time-outline' },
  accepted: { label: 'Joined', bg: DesignColors.infoContainer, icon: 'checkmark-circle-outline' },
  paid: { label: 'Paid', bg: DesignColors.successContainer, icon: 'shield-checkmark-outline' },
};

interface Props {
  members: ManageGroupMember[];
  targetTier: number;
}

export function LobbyMemberList({ members, targetTier }: Props) {
  const filled = members.length;
  const percentage = Math.min(Math.round((filled / targetTier) * 100), 100);
  const isComplete = filled >= targetTier;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>YOUR GROUP</Text>
        <Text style={styles.count}>{filled}/{targetTier}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%` }, isComplete && styles.progressComplete]} />
      </View>

      <View style={styles.memberList}>
        {members.map((member) => {
          const config = STATUS_CONFIG[member.status];
          return (
            <View key={member.id} style={styles.memberRow}>
              {member.avatar_url ? (
                <Image source={{ uri: member.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: getAvatarColor(member.name) }]}>
                  <Text style={styles.initials}>{getInitials(member.name)}</Text>
                </View>
              )}
              <View style={styles.memberInfo}>
                <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
              </View>
              <View style={[styles.statusChip, { backgroundColor: config.bg }]}>
                <Ionicons name={config.icon as never} size={10} color={DesignColors.onSurfaceVariant} />
                <Text style={styles.statusText}>{config.label}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.lg, borderWidth: 1, borderColor: DesignColors.cardBorder, padding: DesignSpacing.md, gap: DesignSpacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1.2 },
  count: { ...DesignTypography.bodyMd, color: DesignColors.primaryBright, fontWeight: '800', fontFamily },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: DesignColors.surfaceContainerHigh, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: DesignColors.primaryBright },
  progressComplete: { backgroundColor: DesignColors.secondary },
  memberList: { gap: 2 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, paddingVertical: 8 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 34, height: 34, borderRadius: 17 },
  initials: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '700', fontFamily, fontSize: 12 },
  memberInfo: { flex: 1 },
  memberName: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '600', fontFamily, fontSize: 14 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: DesignRadius.full },
  statusText: { fontSize: 10, fontWeight: '700', color: DesignColors.onSurfaceVariant, fontFamily },
});
