import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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

const STATUS_CONFIG: Record<ManageGroupMember['status'], { label: string; bg: string }> = {
  you: { label: 'You', bg: DesignColors.primaryContainer },
  pending: { label: 'Invited', bg: DesignColors.warningContainer },
  accepted: { label: 'Joined', bg: DesignColors.infoContainer },
  paid: { label: 'Paid', bg: DesignColors.successContainer },
};

interface Props {
  member: ManageGroupMember;
  onKick: (member: ManageGroupMember) => void;
}

export function GroupMemberRow({ member, onKick }: Props) {
  const config = STATUS_CONFIG[member.status];
  const kickable = member.status !== 'you' && member.status !== 'paid';

  return (
    <View style={styles.row}>
      {member.avatar_url ? (
        <Image source={{ uri: member.avatar_url }} style={styles.avatarImage} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(member.name) }]}>
          <Text style={styles.initials}>{getInitials(member.name)}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{member.name}</Text>
        <View style={styles.meta}>
          <View style={[styles.statusChip, { backgroundColor: config.bg }]}>
            <Text style={styles.statusText}>{config.label}</Text>
          </View>
          {member.via === 'code' && <Text style={styles.viaText}>via code</Text>}
        </View>
      </View>
      {kickable && (
        <Pressable style={styles.kickBtn} onPress={() => onKick(member)} hitSlop={6} testID={`kick-${member.id}`}>
          <Ionicons name="close-circle-outline" size={22} color={DesignColors.error} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, paddingVertical: DesignSpacing.sm + 2, borderBottomWidth: 1, borderBottomColor: DesignColors.borderFaint },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 38, height: 38, borderRadius: 19 },
  initials: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '700', fontFamily, fontSize: 13 },
  info: { flex: 1, gap: 3 },
  name: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '600', fontFamily },
  meta: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  statusChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: DesignRadius.full },
  statusText: { fontSize: 10, fontWeight: '700', color: DesignColors.onSurfaceVariant, fontFamily },
  viaText: { fontSize: 10, color: DesignColors.outline, fontFamily },
  kickBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
