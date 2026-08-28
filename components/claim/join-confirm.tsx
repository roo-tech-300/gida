import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { ClaimSplitSummary } from '@/components/claim/claim-split-summary';

type Props = {
  listingTitle: string;
  listingImage?: string;
  priceLabel: string;
  seatNumber: number;
  totalSeats: number;
  baseRent: number;
  platformFee: number;
  totalCost: number;
};

export function JoinConfirm({
  listingTitle,
  listingImage,
  priceLabel,
  seatNumber,
  totalSeats,
  baseRent,
  platformFee,
  totalCost,
}: Props) {
  const seatsLeft = Math.max(0, totalSeats - seatNumber);

  return (
    <View style={styles.container}>
      <View style={styles.listingCard}>
        {listingImage ? (
          <Image source={{ uri: listingImage }} style={styles.listingImage} />
        ) : (
          <View style={styles.listingFallback}>
            <Ionicons name="business-outline" size={22} color={DesignColors.primaryBright} />
          </View>
        )}
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle} numberOfLines={2}>
            {listingTitle}
          </Text>
          <Text style={styles.listingPrice}>{priceLabel}</Text>
        </View>
      </View>

      <View style={styles.seatCard}>
        <Text style={styles.sectionLabel}>YOUR SEAT</Text>
        <View style={styles.seatRow}>
          <View style={styles.seatIcon}>
            <Ionicons name="person" size={16} color={DesignColors.onPrimary} />
          </View>
          <Text style={styles.seatText}>
            Seat <Text style={styles.seatStrong}>{seatNumber}</Text> of {totalSeats}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: seatNumber }]} />
          <View style={{ flex: Math.max(0, totalSeats - seatNumber) }} />
        </View>
        <Text style={styles.seatHint}>
          {seatsLeft === 1 ? 'Last seat in the group.' : `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} still open.`}
        </Text>
        <Text style={styles.note}>
          This is the same apartment group your friend invited you to. Reserve your seat and you&apos;re in.
        </Text>
      </View>

      <ClaimSplitSummary baseRent={baseRent} platformFee={platformFee} totalCost={totalCost} />

      <View style={styles.deadlineNote}>
        <Ionicons name="time-outline" size={16} color={DesignColors.primaryBright} />
        <Text style={styles.deadlineText}>
          Everyone in the group pays within 3 days of the reservation — the whole group&apos;s spot stays locked together.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: DesignSpacing.md },
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.sm + 2,
  },
  listingImage: { width: 64, height: 64, borderRadius: DesignRadius.sm, backgroundColor: DesignColors.surfaceContainerHigh },
  listingFallback: {
    width: 64,
    height: 64,
    borderRadius: DesignRadius.sm,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: { flex: 1, gap: 4 },
  listingTitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  listingPrice: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily },
  seatCard: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    padding: DesignSpacing.md,
    gap: DesignSpacing.sm,
  },
  sectionLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  seatRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  seatIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: DesignColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatText: { fontSize: 16, color: DesignColors.onSurface, fontFamily },
  seatStrong: { color: DesignColors.primaryBright, fontWeight: '800' },
  progressTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: DesignColors.primaryBright, borderRadius: DesignRadius.full },
  seatHint: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily },
  note: { fontSize: 13, lineHeight: 18, color: DesignColors.onSurfaceVariant, fontFamily },
  deadlineNote: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, paddingHorizontal: 2 },
  deadlineText: { flex: 1, fontSize: 12, lineHeight: 17, color: DesignColors.onSurfaceVariant, fontFamily },
});
