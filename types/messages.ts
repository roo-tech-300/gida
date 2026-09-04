export type ListingAttachment = {
  type: 'listing';
  listingId: string;
  title: string;
  image: string | null;
  price: string;
  location: string;
};

export type TourAttachment = {
  type: 'tour';
  bookingId: string;
  listingId: string;
  title: string;
  image: string | null;
  location: string;
  date: string;
  time: string;
  reference: string;
};

export type RoommateInviteAttachment = {
  type: 'roommate_invite';
  listingId: string;
  title: string;
  image: string | null;
  price: string;
  location: string;
  inviterName: string;
};

export type PodJoinAttachment = {
  type: 'pod_join';
  podId: string;
  listingId: string;
  title: string;
  image: string | null;
  location: string;
  joinerName: string;
  source: 'code' | 'recommendation';
  seatNumber: number;
  totalSeats: number;
};

export type MessageAttachment = ListingAttachment | TourAttachment | RoommateInviteAttachment | PodJoinAttachment;

/** A message as it exists on the server (no device-local ordering fields). */
export type ServerChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  attachment: MessageAttachment | null;
  createdAt: string;
  clientSentAt: number;
  readAt: string | null;
};

/** A message as rendered by this device, ordered by localCreatedAt. */
export type ChatMessage = ServerChatMessage & {
  /** ms since epoch, stamped ONCE when the message first enters THIS device's local DB. Binary ordering key. */
  localCreatedAt: number;
  /** Local-only transient state for the queued-outbox. */
  status?: 'outbox' | 'failed';
};

/** A message queued locally (offline) waiting to be flushed to the server. */
export type QueuedOutboundMessage = {
  id: string;
  conversationId: string | null;
  otherUserId: string;
  senderId: string;
  body: string;
  attachment: MessageAttachment | null;
  clientSentAt: number;
};

export type MessageParticipant = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type Conversation = {
  id: string;
  participant: MessageParticipant;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageSenderId: string | null;
  unreadCount: number;
  createdAt: string;
};

export const MESSAGE_FILTERS = ['All', 'Unread'] as const;

export type MessageFilter = (typeof MESSAGE_FILTERS)[number];

export const MESSAGE_STATUS_ICON: Record<NonNullable<ChatMessage['status']>, 'time-outline' | 'cloud-offline-outline'> = {
  outbox: 'time-outline',
  failed: 'cloud-offline-outline',
};

export const MESSAGE_STATUS_LABEL: Record<NonNullable<ChatMessage['status']>, string> = {
  outbox: 'Pending',
  failed: 'Failed',
};