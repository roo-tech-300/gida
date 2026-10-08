import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors } from '@/constants/design';
import type { AdminMember } from '@/types/admin';
import { useTourAvailability } from '@/hooks/use-tour-bookings';
import { useTourPaymentFlow } from '@/hooks/use-tour-payment-flow';
import { GUIDED_TOUR_FEE_NGN } from '@/services/tour-booking-service';
import { buildDatePills, allSlotsForDate } from '@/utils/tour-availability';
import { TourDatePicker } from './tour-date-picker';
import { TourSlotGrid } from './tour-slot-grid';
import { styles } from './tour-scheduler-modal.styles';

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function TourSchedulerModal({
  propertyId,
  propertyTitle,
  propertyLocation,
  admin,
}: {
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  admin?: AdminMember | null;
}) {
  const { data: availability = [] } = useTourAvailability(propertyId, admin?.id);
  const datePills = useMemo(() => buildDatePills(availability, 7), [availability]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDateIndex >= datePills.length && datePills.length > 0) {
      setSelectedDateIndex(0);
    }
  }, [datePills.length, selectedDateIndex]);

  const selectedDate = datePills[selectedDateIndex]?.date ?? null;
  const slots = useMemo(
    () => (selectedDate ? allSlotsForDate(selectedDate, availability) : []),
    [selectedDate, availability],
  );

  useEffect(() => {
    if (
      selectedSlot &&
      !slots.some((slot) => slot.time === selectedSlot && slot.available)
    ) {
      setSelectedSlot(null);
    }
  }, [slots, selectedSlot]);

  const { handleConfirm, isConfirming } = useTourPaymentFlow({ propertyId, admin, selectedDate, selectedSlot });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.handleArea}>
        <View style={styles.handle} />
      </View>
      <ScrollView bounces={false} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Guided Tour</Text>
        <Text style={styles.headline}>Schedule Your Tour</Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle} numberOfLines={1}>{propertyTitle}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionLabel}>Select Date</Text>
          </View>
          <TourDatePicker pills={datePills} selectedIndex={selectedDateIndex} onSelect={setSelectedDateIndex} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionLabel}>Available Slots</Text>
          </View>
          <TourSlotGrid slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
        </View>

        <View style={styles.agentCard}>
          {admin?.avatar_url ? (
            <Image source={{ uri: admin.avatar_url }} style={styles.agentAvatar} />
          ) : (
            <View style={[styles.agentAvatar, styles.agentAvatarFallback]}>
              <Text style={styles.agentAvatarText}>{getInitials(admin?.full_name ?? 'Admin')}</Text>
            </View>
          )}
          <View style={styles.agentInfo}>
            <Text style={styles.agentLabel}>house admin</Text>
            <Text style={styles.agentName}>{admin?.full_name ?? 'Assigned Admin'}</Text>
          </View>
          <View style={styles.agentBadge}>
            <Ionicons name="shield-checkmark" size={16} color={DesignColors.primaryBright} />
          </View>
        </View>

        <View style={styles.feeCard}>
          <View style={styles.feeIcon}>
            <Ionicons name="card-outline" size={18} color={DesignColors.primaryBright} />
          </View>
          <View style={styles.feeCopy}>
            <Text style={styles.feeLabel}>Guided tour fee</Text>
            <Text style={styles.feeHint}>One-time payment, charged securely via Paystack</Text>
          </View>
          <Text style={styles.feeAmount}>₦{GUIDED_TOUR_FEE_NGN.toLocaleString()}</Text>
        </View>

        <Pressable
          onPress={handleConfirm}
          disabled={!selectedSlot || isConfirming}
          style={[styles.confirmButton, (!selectedSlot || isConfirming) && styles.confirmButtonDisabled]}
        >
          {isConfirming ? (
            <ActivityIndicator color={DesignColors.onPrimary} />
          ) : (
            <>
              <Text style={styles.confirmText}>Confirm & Pay ₦{GUIDED_TOUR_FEE_NGN.toLocaleString()}</Text>
              <Ionicons name="arrow-forward" size={20} color={DesignColors.onPrimary} />
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
