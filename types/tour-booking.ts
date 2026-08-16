export type TourBookingStatus = 'pending_payment' | 'booked' | 'completed' | 'cancelled' | 'expired';

export type TourBooking = {
  id: string;
  user_id: string;
  listing_id: string;
  admin_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: TourBookingStatus;
  created_at: string;
};

export type TourListingBrief = {
  title: string;
  location_landmark: string;
  city: string;
  primary_image: string | null;
  price_amount: number;
  latitude: number | null;
  longitude: number | null;
};

export type TourBookingWithListing = TourBooking & {
  listings: {
    title: string;
    location_landmark: string;
    primary_image: string | null;
  } | null;
};

export type AdminTour = {
  id: string;
  listing_id: string;
  student_name: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: TourBookingStatus;
  created_at: string;
  listings: TourListingBrief | null;
};

export type AdminTourDetail = {
  booking: {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    status: TourBookingStatus;
    created_at: string;
  };
  student: { id: string; name: string | null };
  listing: TourListingBrief | null;
};
