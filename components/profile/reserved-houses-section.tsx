import { ActivityIndicator, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { SlotCredit } from '@/types/liquidity';
import type { ImageSourcePropType } from 'react-native';

const HOUSE_IMAGES: Record<string, ImageSourcePropType> = {
  'est-101': require('@/dummy/images/houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.png'),
  'est-102': require('@/dummy/images/houses/Gemini_Generated_Image_1miazv1miazv1mia.png'),
  'est-103': require('@/dummy/images/houses/Gemini_Generated_Image_5d7v1i5d7v1i5d7v.png'),
  'est-104': require('@/dummy/images/houses/Gemini_Generated_Image_5j0rak5j0rak5j0r.png'),
  'est-105': require('@/dummy/images/houses/Gemini_Generated_Image_1wlh0m1wlh0m1wlh.png'),
  'est-106': require('@/dummy/images/houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.png'),
};

type Props = {
  reservations: SlotCredit[];
  hasError?: boolean;
  isLoading?: boolean;
};

const PAID_STATUSES: SlotCredit['status'][] = ['paid_unmatched', 'matched', 'subletting'];

export function ReservedHousesSection({ reservations, hasError, isLoading }: Props) {
  const router = useRouter();
  const reserved = reservations.filter((credit) => credit.status !== 'expired' || credit.listing_id);

  if (!isLoading && !hasError && reserved.length === 0) {
    return null;
  }

  const openReservation = (credit: SlotCredit) => {
    if (!credit.listing_id) {
      router.push('/property/lobby');
      return;
    }

    if (credit.status === 'booked' || credit.status === 'booked_pending_claim') {
      router.push({ pathname: '/property/pay-slot', params: { id: credit.id } });
      return;
    }

    if (PAID_STATUSES.includes(credit.status)) {
      router.push(credit.target_occupancy === 1 ? { pathname: '/property/booking', params: { id: credit.id } } : '/property/lobby');
      return;
    }

    router.push({ pathname: '/property/pay-slot', params: { id: credit.id } });
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>My Lodge</Text>
        <Text style={styles.sectionHint}>{reserved.length} saved</Text>
      </View>
      {isLoading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator size="small" color={DesignColors.primaryBright} />
          <Text style={styles.stateText}>Loading your reservations...</Text>
        </View>
      ) : hasError ? (
        <View style={styles.stateCard}>
          <Ionicons name="alert-circle-outline" size={18} color={DesignColors.error} />
          <Text style={styles.stateText}>We could not load your reservations right now.</Text>
        </View>
      ) : reserved.length === 0 ? (
        <View style={styles.stateCard}>
          <Ionicons name="home-outline" size={18} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.stateText}>No reserved houses yet. Your bookings will appear here.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {reserved.map((credit) => {
            const estateName = credit.estate?.name ?? 'Reserved Property';
            const statusLabel = getStatusLabel(credit);
            const subLabel = getStatusDetail(credit);
            const coverImage = getCoverImage(credit);
            return (
              <Pressable key={credit.id} style={styles.card} onPress={() => openReservation(credit)} testID={`reservation-${credit.id}`}>
                <View style={styles.coverWrap}>
                  {coverImage ? (
                    <ImageBackground source={coverImage} style={styles.coverImage} imageStyle={styles.coverImageInner}>
                      <View style={styles.coverScrim} />
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>{statusLabel}</Text>
                      </View>
                    </ImageBackground>
                  ) : (
                    <View style={styles.coverFallback}>
                      <Ionicons name="business-outline" size={22} color={DesignColors.primaryBright} />
                    </View>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{estateName}</Text>
                  <Text style={styles.cardMeta}>{subLabel}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.statusPill}>{statusLabel}</Text>
                    <Ionicons name="chevron-forward" size={16} color={DesignColors.onSurfaceVariant} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function getStatusLabel(credit: SlotCredit) {
  if (credit.status === 'expired') return 'Expired';
  if (credit.status === 'booked_pending_claim') return 'Pay Now';
  if (credit.status === 'booked') return 'Reserved';
  if (credit.status === 'paid_unmatched') return 'Paid';
  if (credit.status === 'matched') return 'Matched';
  return 'Subletting';
}

function getStatusDetail(credit: SlotCredit) {
  const occupancy = credit.target_occupancy > 1 ? `${credit.target_occupancy} slots` : 'Solo booking';
  const payment = credit.status === 'booked' || credit.status === 'booked_pending_claim' ? 'Payment pending' : 'Ready to continue';
  const estate = credit.estate?.campus ? ` - ${credit.estate.campus}` : '';
  return `${occupancy}${estate} - ${payment}`;
}

function getCoverImage(credit: SlotCredit): ImageSourcePropType | null {
  if (credit.estate_id && HOUSE_IMAGES[credit.estate_id]) {
    return HOUSE_IMAGES[credit.estate_id];
  }
  if (credit.estate?.primary_image && credit.estate.primary_image.startsWith('http')) {
    return { uri: credit.estate.primary_image };
  }
  return null;
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: DesignSpacing.marginMobile,
    gap: DesignSpacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    paddingTop: 2,
  },
  sectionHint: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  list: {
    gap: DesignSpacing.md,
  },
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.xl,
    overflow: 'hidden',
  },
  coverWrap: {
    height: 108,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  coverImage: {
    flex: 1,
    justifyContent: 'space-between',
    padding: DesignSpacing.sm,
  },
  coverImageInner: {
    borderTopLeftRadius: DesignRadius.xl,
    borderTopRightRadius: DesignRadius.xl,
  },
  coverScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  coverBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: DesignRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  coverBadgeText: {
    ...DesignTypography.labelSm,
    color: DesignColors.surface,
    fontFamily,
    fontWeight: '700',
  },
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  cardBody: {
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    gap: 2,
  },
  cardTitle: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  cardMeta: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  statusPill: {
    ...DesignTypography.labelSm,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryTint,
    overflow: 'hidden',
  },
  stateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingVertical: 2,
  },
  stateText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
    lineHeight: 20,
  },
});
