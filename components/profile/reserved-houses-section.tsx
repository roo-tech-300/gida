import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ImageBackground, Pressable, Text, View } from 'react-native';

import { DesignColors } from '@/constants/design';
import type { SlotCredit } from '@/types/liquidity';
import type { ImageSourcePropType } from 'react-native';

import { styles } from './reserved-houses-section.styles';

const HOUSE_IMAGES: Record<string, ImageSourcePropType> = {
  'est-101': require('@/dummy/images/houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.jpg'),
  'est-102': require('@/dummy/images/houses/Gemini_Generated_Image_1miazv1miazv1mia.jpg'),
  'est-103': require('@/dummy/images/houses/Gemini_Generated_Image_5d7v1i5d7v1i5d7v.jpg'),
  'est-104': require('@/dummy/images/houses/Gemini_Generated_Image_5j0rak5j0rak5j0r.jpg'),
  'est-105': require('@/dummy/images/houses/Gemini_Generated_Image_1wlh0m1wlh0m1wlh.jpg'),
  'est-106': require('@/dummy/images/houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.jpg'),
};

type Props = {
  reservations: SlotCredit[];
  hasError?: boolean;
  isLoading?: boolean;
};

const PAID_STATUSES: SlotCredit['status'][] = ['paid_unmatched', 'matched', 'subletting'];

export function ReservedHousesSection({ reservations, hasError, isLoading }: Props) {
  const router = useRouter();
  const reserved = reservations.filter((credit) => credit.status !== 'expired');

  if (!isLoading && !hasError && reserved.length === 0) {
    return null;
  }

  const openReservation = (credit: SlotCredit) => {
    if (!credit.listing_id) {
      router.push({ pathname: '/property/lobby', params: { creditId: credit.id } });
      return;
    }

    if (credit.status === 'booked' || credit.status === 'booked_pending_claim') {
      router.push({ pathname: '/property/pay-slot', params: { id: credit.id } });
      return;
    }

    if (PAID_STATUSES.includes(credit.status)) {
      router.push(credit.target_occupancy === 1 ? { pathname: '/property/booking', params: { id: credit.id } } : { pathname: '/property/lobby', params: { creditId: credit.id } });
      return;
    }

    if (credit.pod_verification_status === 'pending_verification' || credit.pod_verification_status === 'rejected') {
      router.push({ pathname: '/property/pay-slot', params: { id: credit.id } });
      return;
    }

    router.push({ pathname: '/property/pay-slot', params: { id: credit.id } });
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Your reservations</Text>
        <Text style={styles.sectionHint}>{reserved.length}</Text>
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
            const estateName = credit.estate?.name ?? 'Reserved place';
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
  if (credit.pod_verification_status === 'pending_verification') return 'Under review';
  if (credit.pod_verification_status === 'rejected') return 'Not approved';
  if (credit.status === 'booked_pending_claim') return 'Pay now';
  if (credit.status === 'booked') return 'Reserved';
  if (credit.status === 'paid_unmatched') return 'Paid';
  if (credit.status === 'matched') return 'Matched';
  return 'Subletting';
}

function getStatusDetail(credit: SlotCredit) {
  const occupancy = credit.target_occupancy > 1 ? `Your spot: 1 of ${credit.target_occupancy}` : 'The whole place';
  const payment = credit.status === 'booked' || credit.status === 'booked_pending_claim' ? 'Payment pending'
    : credit.pod_verification_status === 'pending_verification' ? 'Admin reviewing'
    : credit.pod_verification_status === 'rejected' ? 'Not approved'
    : 'Ready to continue';
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
