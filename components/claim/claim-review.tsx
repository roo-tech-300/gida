import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { SlotDiagram } from '@/components/claim/slot-diagram';
import { ClaimSplitSummary } from '@/components/claim/claim-split-summary';
import type { SelectedFriend } from '@/components/claim/friend-picker';

type Props = {
  listingTitle: string;
  listingPriceLabel: string;
  listingImage?: string;
  friendsCount: number;
  codeSeats: number;
  matchedCount: number;
  code: string;
  roster: SelectedFriend[];
  baseRent: number;
  platformFee: number;
  totalCost: number;
};

export function ClaimReview({
  listingTitle,
  listingPriceLabel,
  listingImage,
  friendsCount,
  codeSeats,
  matchedCount,
  code,
  roster,
  baseRent,
  platformFee,
  totalCost,
}: Props) {
  return (
    <>
      <View style={styles.listingMini}>
        <View style={styles.listingAccent} />
        {listingImage && <Image source={{ uri: listingImage }} style={styles.listingThumb} />}
        <View style={styles.listingMiniInfo}>
          <Text style={styles.listingMiniTitle} numberOfLines={1}>
            {listingTitle}
          </Text>
          <Text style={styles.listingMiniPrice}>{listingPriceLabel}</Text>
        </View>
      </View>

      <View style={styles.groupCard}>
        <Text style={styles.sectionLabel}>YOUR GROUP</Text>
        <SlotDiagram friendsCount={friendsCount} codeCount={codeSeats} matchedCount={matchedCount} />
        {roster.length > 0 && (
          <View style={styles.roster}>
            {roster.map((friend) => (
              <View key={friend.id} style={styles.rosterChip}>
                <Ionicons name="person" size={14} color={DesignColors.primaryBright} />
                <Text style={styles.rosterName} numberOfLines={1}>
                  {friend.name}
                </Text>
              </View>
            ))}
          </View>
        )}
        {matchedCount > 0 && (
          <View style={styles.noteRow}>
            <Ionicons name="sparkles-outline" size={16} color={DesignColors.primaryBright} />
            <Text style={styles.noteText}>
              Gida will go and look for {matchedCount} roommate{matchedCount === 1 ? '' : 's'} for you.
            </Text>
          </View>
        )}
      </View>

      <ClaimSplitSummary baseRent={baseRent} platformFee={platformFee} totalCost={totalCost} />

      <View style={styles.deadlineCard}>
        <Ionicons name="time-outline" size={18} color={DesignColors.warning} />
        <Text style={styles.deadlineText}>
          Pay within <Text style={styles.deadlineStrong}>3 days</Text> to keep your spot — every member of your
          group shares the same deadline.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  listingMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    overflow: 'hidden',
  },
  listingAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryBright,
  },
  listingThumb: { width: 44, height: 44, borderRadius: 10 },
  listingMiniInfo: { flex: 1, gap: 2 },
  listingMiniTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: DesignColors.onSurface,
    fontFamily,
  },
  listingMiniPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignColors.primaryBright,
    fontFamily,
  },
  groupCard: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.md,
    gap: DesignSpacing.sm,
  },
  sectionLabel: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  roster: { gap: DesignSpacing.xs + 2 },
  rosterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    borderRadius: DesignRadius.sm,
    paddingHorizontal: DesignSpacing.sm + 2,
    paddingVertical: 6,
  },
  codeChip: {
    backgroundColor: DesignColors.surfaceContainer,
    borderColor: DesignColors.primaryTintBorder,
    borderStyle: 'dashed',
  },
  rosterName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: DesignColors.onPrimaryContainer,
    fontFamily,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.surfaceContainer,
    borderRadius: DesignRadius.sm,
    padding: DesignSpacing.sm + 2,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm + 2,
    backgroundColor: DesignColors.warningContainer,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 208, 138, 0.3)',
    padding: DesignSpacing.md,
  },
  deadlineText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  deadlineStrong: {
    color: DesignColors.warning,
    fontWeight: '700',
    fontFamily,
  },
});
