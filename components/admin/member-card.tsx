import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, fontFamily } from '@/constants/design';
import type { AdminMember } from '@/types/admin';
import { getInitials } from '@/utils/get-initials';

const ROLE_LABELS: Record<AdminMember['role'], string> = {
  super_admin: 'Super Admin',
  regional_admin: 'Regional Admin',
  field_admin: 'Field Admin',
};

type Props = {
  member: AdminMember;
};

export function MemberCard({ member }: Props) {
  const isSuper = member.role === 'super_admin';
  const regionLine = isSuper ? 'Global Access' : member.region_name ?? 'No region assigned';
  const initials = getInitials(member.full_name);

  return (
    <View style={styles.card}>
      {member.avatar_url ? (
        <Image source={{ uri: member.avatar_url }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{member.full_name}</Text>
        {member.email ? <Text style={styles.email} numberOfLines={1}>{member.email}</Text> : null}
        <View style={styles.badges}>
          <Text style={styles.role}>{ROLE_LABELS[member.role]}</Text>
          <Text style={styles.region} numberOfLines={1}>{regionLine}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 12,
    padding: 16,
    backgroundColor: DesignColors.surface,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: DesignColors.primary, fontFamily },
  info: { flex: 1, gap: 1 },
  name: { fontSize: 16, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  email: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily, marginBottom: 2 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  role: { fontSize: 12, fontWeight: '600', color: DesignColors.primary, fontFamily },
  region: { fontSize: 12, fontWeight: '500', color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.8 },
});