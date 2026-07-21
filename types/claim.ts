export type ApplicationStatus =
  | 'locked_pending_roommate'
  | 'locked_pending_payment'
  | 'partially_paid'
  | 'active'
  | 'expired'
  | 'completed';

export type RoommateInviteStatus = 'pending' | 'accepted' | 'declined' | 'paid';

export type Application = {
  id: string;
  listing_id: string;
  student_id: string;
  status: ApplicationStatus;
  lock_expires_at: string;
  created_at: string;
};

export type ApplicationRoommate = {
  id: string;
  application_id: string;
  student_id: string;
  invite_status: RoommateInviteStatus;
  split_amount: number;
  has_paid: boolean;
  created_at: string;
};

export type ClaimWithRoommates = Application & {
  application_roommates: ApplicationRoommate[];
  listing?: {
    id: string;
    title: string;
    price_amount: number;
    primary_image: string | null;
    max_roommates: number;
    rules: string[];
  };
};
