/** One row in the Chats inbox: the group chat for a roommate group. */
export interface HouseholdChat {
  podId: string;
  listingTitle: string | null;
  memberCount: number;
  /** Member ids and first names, aligned, in join order. */
  memberIds: string[];
  memberNames: string[];
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastSenderId: string | null;
  lastSenderName: string | null;
  unreadCount: number;
}

export interface HouseholdMessage {
  id: string;
  podId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export const HOUSEHOLD_MESSAGE_MAX_LENGTH = 2000;
