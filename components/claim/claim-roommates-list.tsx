import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import {
  DesignColors,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';
import type { ApplicationRoommate, RoommateInviteStatus } from '@/types/claim';

type Props = {
  roommates: ApplicationRoommate[];
  allPaid: boolean;
  onRemind?: (studentId: string) => void;
};

const STATUS_CONFIG: Record<
  RoommateInviteStatus,
  { color: string; bg: string; label: string; icon: string }
> = {
  paid: { color: DesignColors.secondary, bg: DesignColors.secondary + '20', label: 'Paid', icon: 'checkmark-circle' },
  accepted: { color: DesignColors.primaryFixed, bg: DesignColors.primaryFixed + '20', label: 'Confirmed', icon: 'checkmark-circle-outline' },
  pending: { color: DesignColors.tertiary, bg: DesignColors.tertiary + '20', label: 'Waiting', icon: 'time-outline' },
  declined: { color: DesignColors.error, bg: DesignColors.error + '20', label: 'Declined', icon: 'close-circle' },
};

function getInitial(name: string | null | undefined) {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

function getInitialColor(name: string | null | undefined) {
  if (!name) return DesignColors.outline;
  const charCode = name.charCodeAt(0);
  const colors = ['#10B981', '#60A5FA', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];
  return colors[charCode % colors.length];
}

export function ClaimRoommatesList({ roommates, allPaid, onRemind }: Props) {
  const { profile } = useAuth();
  const currentUserId = profile?.id;

  if (!roommates.length) return null;

  const paidCount = roommates.filter((r) => r.has_paid).length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="people-outline" size={20} color={DesignColors.onSurface} />
        <Text style={styles.headerTitle}>Roommates</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {paidCount}/{roommates.length} paid
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {roommates.map((rm) => {
          const isSelf = rm.student_id === currentUserId;
          const status = STATUS_CONFIG[rm.invite_status];
          const displayName = isSelf
            ? 'You'
            : rm.full_name || 'Invited Roommate';

          return (
            <View key={rm.id} style={styles.row}>
              <View style={styles.left}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: getInitialColor(rm.full_name) },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {getInitial(rm.full_name)}
                  </Text>
                </View>

                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {displayName}
                    </Text>
                    {rm.has_paid && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={DesignColors.secondary}
                      />
                    )}
                  </View>
                  <View style={styles.statusRow}>
                    <View
                      style={[styles.statusDot, { backgroundColor: status.color }]}
                    />
                    <Text style={[styles.statusLabel, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.right}>
                <Text style={styles.amount}>
                  ₦{rm.split_amount.toLocaleString()}
                </Text>
                {rm.invite_status === 'pending' && !isSelf && onRemind && (
                  <TouchableOpacity
                    style={styles.remindBtn}
                    onPress={() => onRemind(rm.student_id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="notifications-outline"
                      size={13}
                      color={DesignColors.primaryBright}
                    />
                    <Text style={styles.remindText}>Remind</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    marginBottom: DesignSpacing.md,
  },
  headerTitle: {
    ...DesignTypography.titleMd,
    color: DesignColors.onSurface,
    fontFamily,
    flex: 1,
  },
  countBadge: {
    backgroundColor: DesignColors.surfaceContainerHighest,
    borderRadius: DesignRadius.sm,
    paddingHorizontal: DesignSpacing.sm,
    paddingVertical: 3,
  },
  countText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  list: {
    gap: DesignSpacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: DesignSpacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: DesignColors.surface,
    fontSize: 16,
    fontFamily,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
    flexShrink: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    ...DesignTypography.labelSm,
    fontFamily,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  remindText: {
    fontSize: 11,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '600',
  },
});
