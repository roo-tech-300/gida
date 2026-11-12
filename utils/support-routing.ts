export interface RoutedPair {
  /** The two conversation participants. The caller sorts them into participant_a/participant_b. */
  firstId: string;
  secondId: string;
  /** Whose point of view the conversation is read from (unread counts, "other side"). */
  readerId: string;
  /** The person shown as the other side of the chat. */
  otherId: string;
}

interface RouteInput {
  myId: string;
  otherId: string;
  supportAdminId: string | null;
  isStaff: (id: string) => boolean;
}

/**
 * Every chat between a student and Gida staff lives in one thread with the support admin.
 *   student -> any admin     : thread with the support admin
 *   any admin -> student     : the same thread, read as the support admin
 * Chats between two students, or between two staff members, are left alone.
 */
export function routeConversationPair({ myId, otherId, supportAdminId, isStaff }: RouteInput): RoutedPair {
  const unchanged: RoutedPair = { firstId: myId, secondId: otherId, readerId: myId, otherId };
  if (!supportAdminId) return unchanged;

  const meIsStaff = isStaff(myId);
  const otherIsStaff = isStaff(otherId);

  if (!meIsStaff && otherIsStaff) {
    return { firstId: myId, secondId: supportAdminId, readerId: myId, otherId: supportAdminId };
  }
  if (meIsStaff && !otherIsStaff) {
    return { firstId: supportAdminId, secondId: otherId, readerId: supportAdminId, otherId };
  }
  return unchanged;
}
