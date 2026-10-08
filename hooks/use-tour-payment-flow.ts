import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';

import type { AdminMember } from '@/types/admin';
import { useReserveTour } from '@/hooks/use-tour-bookings';
import { useVerifyLocationPayment } from '@/hooks/use-location-access';
import { findPendingBooking, notifyAdminOfTourBooking } from '@/services/tour-booking-service';
import { payForTour } from '@/services/tour-payment-service';
import { useAppToast } from '@/components/ui/toast-card';
import { extractReference } from '@/utils/paystack';
import { dateKey, formatTourDate } from '@/utils/tour-availability';

export function useTourPaymentFlow({
  propertyId,
  admin,
  selectedDate,
  selectedSlot,
}: {
  propertyId: string;
  admin?: AdminMember | null;
  selectedDate: Date | null;
  selectedSlot: string | null;
}) {
  const reserveTour = useReserveTour();
  const verifyPayment = useVerifyLocationPayment();
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();
  const [isConfirming, setIsConfirming] = useState(false);

  const notifyAdmin = useCallback((bookingId: string, date: string, time: string, adminId: string | null) => {
    void notifyAdminOfTourBooking({ listingId: propertyId, bookingId, adminId, date, time }).catch((error) => {
      console.error('[TourPayment] Failed to notify admin:', error);
    });
  }, [propertyId]);

  const handleConfirm = useCallback(async () => {
    if (!selectedDate || !selectedSlot || isConfirming) return;
    if (!admin) {
      showToast({ message: 'This tour needs a house admin. Please try again.', type: 'error' });
      return;
    }
    setIsConfirming(true);
    try {
      const date = dateKey(selectedDate);
      const reserve = await reserveTour.mutateAsync({ listingId: propertyId, adminId: admin.id, date, time: selectedSlot });
      if (reserve.error === 'slot_full' || reserve.error === 'admin_unavailable') {
        await queryClient.invalidateQueries({ queryKey: ['tour-availability', propertyId] });
        showToast({ message: reserve.error === 'slot_full'
          ? 'That time just filled up. Please pick another slot.'
          : 'This admin is guiding another tour then. Please pick a different time.', type: 'error' });
        return;
      }
      const reserveMessages = {
        tours_disabled: 'Tours are no longer available for this listing.',
        no_location: "This listing doesn't have a mapped location yet, so tours can't be scheduled.",
        listing_not_found: 'This listing is no longer available.',
      } as const;
      if (reserve.error && reserve.error in reserveMessages) {
        showToast({ message: reserveMessages[reserve.error as keyof typeof reserveMessages], type: 'error' });
        return;
      }

      let bookingId: string;
      let bookingDate = date;
      let bookingTime = selectedSlot;
      if (reserve.error === 'already_booked') {
        const pending = await findPendingBooking(propertyId);
        if (!pending) {
          showToast({ message: 'You already have a tour booked for this property.', type: 'info' });
          return;
        }
        bookingId = pending.id;
        bookingDate = pending.scheduled_date;
        bookingTime = pending.scheduled_time;
      } else if (reserve.booking) {
        bookingId = reserve.booking.id;
      } else {
        showToast({ message: 'We could not reserve that slot. Please try again.', type: 'error' });
        return;
      }

      const formattedDate = formatTourDate(bookingDate);
      const passParams = `id=${propertyId}&bookingId=${bookingId}&date=${encodeURIComponent(formattedDate)}&time=${encodeURIComponent(bookingTime)}`;
      const init = await payForTour({ listingId: propertyId, bookingId, date: bookingDate, time: bookingTime });
      if (init.simulated) {
        await new Promise((resolve) => setTimeout(resolve, 1300));
        notifyAdmin(bookingId, bookingDate, bookingTime, admin.id);
        router.replace(`/property/tour-pass?${passParams}`);
        return;
      }
      if (!init.authorizationUrl) return;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.location.href = init.authorizationUrl;
        return;
      }

      const callback = `gida://property/location-unlock-callback?listingId=${propertyId}&kind=tour&bookingId=${bookingId}&date=${encodeURIComponent(formattedDate)}&time=${encodeURIComponent(bookingTime)}`;
      const result = await WebBrowser.openAuthSessionAsync(init.authorizationUrl, callback);
      const reference = result.type === 'success' ? extractReference(result.url) ?? init.reference : init.reference;
      if (!reference) return;
      const verified = await verifyPayment.mutateAsync(reference);
      if (verified.unlocked) {
        notifyAdmin(bookingId, bookingDate, bookingTime, admin.id);
        router.replace(`/property/tour-pass?${passParams}`);
      } else {
        showToast({ message: 'Payment is pending confirmation. Your slot is held — please check back shortly.', type: 'info' });
      }
    } catch (error) {
      console.error('[TourPayment] Booking flow failed:', error);
      showToast({ message: error instanceof Error ? error.message : 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setIsConfirming(false);
    }
  }, [selectedDate, selectedSlot, isConfirming, admin, propertyId, reserveTour, queryClient, showToast, notifyAdmin, verifyPayment]);

  return { handleConfirm, isConfirming };
}
