import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { AdminMember } from '@/types/admin';
import { useReserveTour, useTourAvailability } from '@/hooks/use-tour-bookings';
import { useVerifyLocationPayment } from '@/hooks/use-location-access';
import { GUIDED_TOUR_FEE_NGN, payForTour } from '@/services/tour-booking-service';
import { useAppToast } from '@/components/ui/toast-card';
import { extractReference } from '@/utils/paystack';
import { buildDatePills, dateKey, formatTourDate, slotsForDate } from '@/utils/tour-availability';
import { TourDatePicker } from './tour-date-picker';
import { TourSlotGrid } from './tour-slot-grid';

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
  const { data: availability = [] } = useTourAvailability(propertyId);
  const reserveTour = useReserveTour();
  const verifyPayment = useVerifyLocationPayment();
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();

  const datePills = useMemo(() => buildDatePills(availability, 7), [availability]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (selectedDateIndex >= datePills.length && datePills.length > 0) {
      setSelectedDateIndex(0);
    }
  }, [datePills.length, selectedDateIndex]);

  const selectedDate = datePills[selectedDateIndex]?.date ?? null;
  const slots = useMemo(
    () => (selectedDate ? slotsForDate(selectedDate, availability) : []),
    [selectedDate, availability],
  );

  useEffect(() => {
    if (selectedSlot && !slots.includes(selectedSlot)) {
      setSelectedSlot(null);
    }
  }, [slots, selectedSlot]);

  const handleConfirm = useCallback(async () => {
    if (!selectedDate || !selectedSlot || isConfirming) return;
    setIsConfirming(true);
    try {
      const reserve = await reserveTour.mutateAsync({
        listingId: propertyId,
        adminId: admin?.id ?? null,
        date: dateKey(selectedDate),
        time: selectedSlot,
      });
      if (reserve.error === 'slot_full') {
        queryClient.invalidateQueries({ queryKey: ['tour-availability', propertyId] });
        showToast({ message: 'That time just filled up. Please pick another slot.', type: 'error' });
        return;
      }
      if (reserve.error === 'already_booked') {
        showToast({ message: 'You already have a tour booked for this property.', type: 'info' });
        return;
      }
      if (!reserve.booking) {
        showToast({ message: 'We could not reserve that slot. Please try again.', type: 'error' });
        return;
      }

      const formattedDate = formatTourDate(dateKey(selectedDate));
      const passParams =
        `id=${propertyId}&bookingId=${reserve.booking.id}` +
        `&date=${encodeURIComponent(formattedDate)}&time=${encodeURIComponent(selectedSlot)}`;

      const init = await payForTour({
        listingId: propertyId,
        bookingId: reserve.booking.id,
        date: dateKey(selectedDate),
        time: selectedSlot,
      });
      if (init.simulated) {
        await new Promise((resolve) => setTimeout(resolve, 1300));
        router.replace(`/property/tour-pass?${passParams}`);
        return;
      }
      if (!init.authorizationUrl) {
        return;
      }
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.location.href = init.authorizationUrl;
        }
        return;
      }

      const redirectUrl =
        `gida://property/location-unlock-callback?listingId=${propertyId}&kind=tour` +
        `&bookingId=${reserve.booking.id}&date=${encodeURIComponent(formattedDate)}` +
        `&time=${encodeURIComponent(selectedSlot)}`;
      const result = await WebBrowser.openAuthSessionAsync(init.authorizationUrl, redirectUrl);
      const reference = result.type === 'success' ? extractReference(result.url) ?? init.reference : init.reference;
      if (!reference) {
        return;
      }
      const verified = await verifyPayment.mutateAsync(reference);
      if (verified.unlocked) {
        router.replace(`/property/tour-pass?${passParams}`);
      } else {
        showToast({
          message: 'Payment is pending confirmation. Your slot is held — please complete payment soon.',
          type: 'info',
        });
      }
    } catch (error) {
      console.error('[TourScheduler] Booking flow failed:', error);
      showToast({ message: 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setIsConfirming(false);
    }
  }, [selectedDate, selectedSlot, isConfirming, propertyId, admin?.id, reserveTour, verifyPayment, queryClient, showToast]);

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
          <Text style={styles.confirmText}>Confirm & Pay ₦{GUIDED_TOUR_FEE_NGN.toLocaleString()}</Text>
          <Ionicons name="arrow-forward" size={20} color={DesignColors.onPrimary} />
        </Pressable>
      </ScrollView>

      {isConfirming && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBadge}>
            <Ionicons name="checkmark-done" size={40} color={DesignColors.onPrimary} />
          </View>
          <Text style={styles.loadingTitle}>Securing your slot...</Text>
          <Text style={styles.loadingSub}>with {admin?.full_name ?? 'your tour guide'}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surface },
  handleArea: { height: 32, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 44, height: 5, borderRadius: DesignRadius.full, backgroundColor: DesignColors.outlineVariant },
  content: { padding: DesignSpacing.marginMobile, paddingBottom: DesignSpacing.xl * 2, gap: DesignSpacing.lg },
  eyebrow: { ...DesignTypography.labelCaps, color: DesignColors.primaryBright, fontFamily, textTransform: 'uppercase', letterSpacing: 2 },
  headline: { ...DesignTypography.headlineLg, color: DesignColors.onSurface, fontFamily },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, flexWrap: 'wrap' },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, flexShrink: 1 },
  section: { gap: DesignSpacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.xs },
  sectionAccent: { width: 3, height: 14, borderRadius: 2, backgroundColor: DesignColors.primaryBright },
  sectionLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, textTransform: 'uppercase', letterSpacing: 1.6 },
  agentCard: {
    flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md,
    backgroundColor: DesignColors.glassFill, borderRadius: DesignRadius.xl,
    borderWidth: 1, borderColor: DesignColors.cardBorder, padding: DesignSpacing.md,
  },
  agentAvatar: { width: 48, height: 48, borderRadius: DesignRadius.full },
  agentAvatarFallback: { backgroundColor: DesignColors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  agentAvatarText: { ...DesignTypography.bodyLg, color: DesignColors.primaryBright, fontFamily, fontWeight: '700' },
  agentInfo: { flex: 1, gap: 2 },
  agentLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, textTransform: 'uppercase', letterSpacing: 0.8 },
  agentName: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  agentBadge: {
    width: 28,
    height: 28,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    backgroundColor: DesignColors.primaryTint,
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    padding: DesignSpacing.md,
  },
  feeIcon: {
    width: 36,
    height: 36,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeCopy: { flex: 1, gap: 2 },
  feeLabel: { ...DesignTypography.labelCaps, color: DesignColors.primaryBright, fontFamily },
  feeHint: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  feeAmount: { ...DesignTypography.headlineMd, color: DesignColors.primaryBright, fontFamily, fontWeight: '700' },
  confirmButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primary, borderRadius: DesignRadius.full, height: 54,
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmText: { ...DesignTypography.bodyLg, color: DesignColors.onPrimary, fontFamily, fontWeight: '700' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: DesignColors.surface, alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm },
  loadingBadge: {
    width: 72, height: 72, borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primary, alignItems: 'center', justifyContent: 'center',
  },
  loadingTitle: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, marginTop: DesignSpacing.sm },
  loadingSub: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
});
