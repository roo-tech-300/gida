import { useState } from 'react';
import { router } from 'expo-router';

import { useTourBookings } from '@/hooks/use-tour-bookings';
import type { DbListing, FeedListing } from '@/types/feed-listing';
import { formatTourDate } from '@/utils/tour-availability';

/** Tour availability, the student's active booking for this listing, and the tour sheet's open state. */
export function usePropertyTour(property: FeedListing, dbListing?: DbListing) {
  const { data: myTours = [] } = useTourBookings();
  const [open, setOpen] = useState(false);

  const activeTour = myTours.find(
    (tour) => tour.listing_id === property.id && (tour.status === 'pending_payment' || tour.status === 'booked'),
  );
  const toursEnabled = (dbListing?.enable_guided_tour ?? true) || (dbListing?.enable_self_guided_tour ?? true);
  const hasLocation = dbListing == null || (dbListing.latitude != null && dbListing.longitude != null);
  const available = (toursEnabled && hasLocation) || !!activeTour;

  const goAssistedTour = () => {
    setOpen(false);
    if (activeTour) {
      router.push(
        `/property/tour-pass?id=${property.id}&bookingId=${activeTour.id}&date=${encodeURIComponent(formatTourDate(activeTour.scheduled_date))}&time=${encodeURIComponent(activeTour.scheduled_time)}`,
      );
      return;
    }
    router.push(`/property/tour-scheduler?id=${property.id}`);
  };

  return { open, openTour: () => setOpen(true), closeTour: () => setOpen(false), activeTour, available, goAssistedTour };
}
