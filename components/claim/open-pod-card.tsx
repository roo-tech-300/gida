import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import type { Pod } from '@/types/liquidity';

const AVATAR_COLORS = [
  DesignColors.primaryContainer,
  '#E8D5F5',
  '#D5EEF5',
  '#F5E6D5',
  '#D5F5E6',
  '#F5D5E0',
];

function getInitials(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name ?? '').slice(0, 2).toUpperCase() || '??';
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name ?? '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

type Props = {
  pod: Pod;
  onPress: () => void;
};

export function OpenPodCard({ pod, onPress }: Props) {
  const realMembers = pod.members.filter((m) => m.slot_credit_id !== 'invitation');
  const filled = pod.current_total_intent;
  const total = pod.target_occupancy;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress} testID={`open-pod-${pod.id}`}>
      <View style={styles.avatars}>
        {realMembers.slice(0, 4).map((member) => {
          const displayName = member.profile?.full_name || member.full_name || 'Roommate';
          const avatarUrl = member.profile?.avatar_url || member.avatar_url;
          return (
            <View key={member.user_id} style={styles.avatarShell}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarInner, { backgroundColor: getAvatarColor(displayName) }]}>
                  <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
                </View>
              )}
            </View>
          );
        })}
        {filled < total && (
          <View style={[styles.avatarShell, styles.openSeat]}>
            <Ionicons name="add" size={14} color={DesignColors.onPrimary} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.seats}>
          <Text style={styles.seatsStrong}>{filled}</Text>/{total} people already in
        </Text>
        <Text style={styles.hint}>{total - filled === 1 ? '1 seat open' : `${total - filled} seats open`} — tap to see who&apos;s in</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={DesignColors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.md,
  },
  cardPressed: { backgroundColor: DesignColors.surfaceContainerHigh },
  avatars: { flexDirection: 'row', alignItems: 'center' },
  avatarShell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    borderWidth: 2,
    borderColor: DesignColors.surfaceContainerLow,
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  avatarInner: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 11, fontWeight: '700', color: DesignColors.onPrimaryContainer, fontFamily },
  openSeat: {
    backgroundColor: DesignColors.primary,
    borderColor: DesignColors.surfaceContainerLow,
  },
  info: { flex: 1, gap: 2 },
  seats: { fontSize: 14, color: DesignColors.onSurface, fontFamily },
  seatsStrong: { fontWeight: '800', color: DesignColors.primaryBright },
  hint: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily },
});
