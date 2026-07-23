import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { ClaimCountdown } from './claim-countdown';
import type { ApplicationRoommate, RoommateInviteStatus } from '@/types/claim';

type Props = {
  expiresAt: string;
  roommates: ApplicationRoommate[];
  currentUserId: string;
  onPayNow: () => void;
  onExpired?: () => void;
  onFindNewRoommate?: () => void;
};

const STATUS_CONFIG: Record<RoommateInviteStatus, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { color: DesignColors.textSecondary, label: 'Waiting', icon: 'hourglass-outline' },
  accepted: { color: DesignColors.secondary, label: 'Accepted', icon: 'checkmark-circle-outline' },
  declined: { color: DesignColors.error, label: 'Declined', icon: 'close-circle-outline' },
  paid: { color: DesignColors.secondary, label: 'Paid', icon: 'checkmark-done-circle-outline' },
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-US')}`;
}

export function ClaimStatusCard({ expiresAt, roommates, currentUserId, onPayNow, onExpired, onFindNewRoommate }: Props) {
  const currentUser = roommates.find((r) => r.student_id === currentUserId);
  const isPaid = currentUser?.has_paid ?? false;
  const hasDeclined = roommates.some((r) => r.invite_status === 'declined' && r.student_id !== currentUserId);

  return (
    <View style={styles.card}>
      <ClaimCountdown expiresAt={expiresAt} onExpired={onExpired} />

      <View style={styles.roommatesSection}>
        <Text style={styles.sectionLabel}>ROOMMATES</Text>
        {roommates.map((rm) => {
          const isCurrent = rm.student_id === currentUserId;
          const config = STATUS_CONFIG[rm.invite_status];
          return (
            <View key={rm.id} style={styles.roommateRow}>
              <View style={styles.roommateLeft}>
                <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                <View>
                  <Text style={styles.roommateName}>
                    {isCurrent ? 'You' : `Roommate ${rm.student_id.slice(0, 6)}`}
                  </Text>
                  <Text style={[styles.roommateStatus, { color: config.color }]}>{config.label}</Text>
                </View>
              </View>
              <Text style={styles.splitAmount}>{formatNaira(rm.split_amount)}</Text>
            </View>
          );
        })}
      </View>

      {!isPaid && (
        <Pressable style={styles.payButton} onPress={onPayNow}>
          <Ionicons name="card-outline" size={20} color={DesignColors.onPrimaryContainer} />
          <Text style={styles.payText}>Pay Now</Text>
        </Pressable>
      )}

      {isPaid && (
        <View style={styles.paidBadge}>
          <Ionicons name="checkmark-done" size={18} color={DesignColors.secondary} />
          <Text style={styles.paidText}>Your share is paid</Text>
        </View>
      )}

      {hasDeclined && onFindNewRoommate && (
        <View style={styles.declinedSection}>
          <View style={styles.declinedBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={DesignColors.error} />
            <Text style={styles.declinedText}>A roommate declined the invite</Text>
          </View>
          <Pressable style={styles.findNewButton} onPress={onFindNewRoommate}>
            <Ionicons name="person-add-outline" size={18} color={DesignColors.onPrimaryContainer} />
            <Text style={styles.findNewText}>Find New Roommate</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.md,
    gap: DesignSpacing.md,
  },
  roommatesSection: {
    gap: DesignSpacing.sm,
  },
  sectionLabel: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  roommateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderRadius: DesignRadius.sm,
    padding: DesignSpacing.sm,
  },
  roommateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roommateName: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  roommateStatus: {
    ...DesignTypography.labelSm,
    fontFamily,
  },
  splitAmount: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.xl,
    paddingVertical: 14,
  },
  payText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: 'rgba(74, 225, 118, 0.12)',
    borderRadius: DesignRadius.xl,
    paddingVertical: 14,
  },
  paidText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.secondary,
    fontFamily,
    fontWeight: '700',
  },
  declinedSection: {
    gap: DesignSpacing.sm,
  },
  declinedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.errorContainer,
    borderRadius: DesignRadius.sm,
    padding: DesignSpacing.sm,
  },
  declinedText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onErrorContainer,
    fontFamily,
    fontWeight: '600',
    flex: 1,
  },
  findNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.xl,
    paddingVertical: 14,
  },
  findNewText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
});
