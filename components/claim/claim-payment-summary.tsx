import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  DesignColors,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';
import type { ClaimWithRoommates } from '@/types/claim';

type Props = {
  claim: ClaimWithRoommates;
  currentUserId: string;
};

function parsePriceAmount(dbPrice: string | number): number {
  if (typeof dbPrice === 'number') return dbPrice;
  return parseInt(dbPrice.replace(/[^0-9]/g, ''), 10);
}

export function ClaimPaymentSummary({ claim, currentUserId }: Props) {
  const { application_roommates: roommates, listing } = claim;
  const totalRent = listing ? parsePriceAmount(listing.price_amount) : 0;
  const totalCollected = roommates
    .filter((r) => r.has_paid)
    .reduce((sum, r) => sum + r.split_amount, 0);
  const myShare = roommates.find((r) => r.student_id === currentUserId);
  const progress = totalRent > 0 ? totalCollected / totalRent : 0;

  return (
    <View style={styles.card}>
      <View style={styles.listingRow}>
        <Ionicons name="home-outline" size={18} color={DesignColors.onSurfaceVariant} />
        <Text style={styles.listingTitle} numberOfLines={1}>
          {listing?.title ?? 'Listing'}
        </Text>
      </View>

      {totalRent > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Payment progress</Text>
            <Text style={styles.progressAmount}>
              ₦{totalCollected.toLocaleString()} / ₦{totalRent.toLocaleString()}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(progress * 100, 0)}%` }]} />
          </View>
        </View>
      )}

      {myShare && (
        <View style={styles.shareSection}>
          <View style={styles.shareInfo}>
            <Text style={styles.shareLabel}>Your share</Text>
            <Text style={styles.shareAmount}>₦{myShare.split_amount.toLocaleString()}</Text>
          </View>
          <View
            style={[
              styles.paidBadge,
              myShare.has_paid ? styles.paidBadgeOk : styles.paidBadgePending,
            ]}
          >
            <Ionicons
              name={myShare.has_paid ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={myShare.has_paid ? DesignColors.secondary : DesignColors.tertiary}
            />
            <Text
              style={[
                styles.paidBadgeText,
                { color: myShare.has_paid ? DesignColors.secondary : DesignColors.tertiary },
              ]}
            >
              {myShare.has_paid ? 'Paid' : 'Unpaid'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={16} color={DesignColors.onSurfaceVariant} />
        <Text style={styles.detailLabel}>Claimed</Text>
        <Text style={styles.detailValue}>
          {new Date(claim.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      {listing?.max_roommates && listing.max_roommates > 1 && (
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.detailLabel}>
            This space allows up to {listing.max_roommates} roommates
          </Text>
        </View>
      )}
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
    gap: DesignSpacing.md,
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  listingTitle: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
    flex: 1,
  },
  progressSection: {
    gap: DesignSpacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  progressAmount: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    backgroundColor: DesignColors.surfaceContainerHighest,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: DesignColors.primaryBright,
    borderRadius: 2,
  },
  shareSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: DesignColors.cardBorder,
  },
  shareInfo: {
    gap: 2,
  },
  shareLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  shareAmount: {
    ...DesignTypography.titleMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: DesignSpacing.sm,
    paddingVertical: 4,
    borderRadius: DesignRadius.sm,
  },
  paidBadgeOk: {
    backgroundColor: DesignColors.secondary + '20',
  },
  paidBadgePending: {
    backgroundColor: DesignColors.tertiary + '20',
  },
  paidBadgeText: {
    ...DesignTypography.labelSm,
    fontFamily,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  detailLabel: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
  detailValue: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '500',
  },
});
