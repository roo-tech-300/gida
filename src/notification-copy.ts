import type { ServerChatMessage } from '@/types/messages';

/**
 * Pure presentation helpers for push notification copy.
 * Kept free of React and Firebase so the runtime layer in
 * `src/notifications.ts` stays small and these stay trivially testable.
 */

export const getNotificationTitle = (message: ServerChatMessage): string => {
  const attachment = message.attachment;

  if (!attachment) {
    return 'New Message';
  }

  switch (attachment.type) {
    case 'listing':
      return 'Listing Shared';
    case 'tour':
      return 'New Tour Booking';
    case 'roommate_invite':
      return 'Roommate Invite';
    case 'pod_join':
      return 'Pod Invitation';
    case 'lodge_reservation':
      return 'New Lodge Application';
    case 'lodge_decision':
      return 'Lodge Decision';
    default:
      return 'New Message';
  }
};

export const getNotificationBody = (message: ServerChatMessage): string => {
  const attachment = message.attachment;

  if (!attachment || !message.body) {
    return message.body || 'New message';
  }

  switch (attachment.type) {
    case 'listing':
      return `${attachment.title ?? 'Property'}: ${message.body?.slice(0, 50) || ''}`.trim();

    case 'tour': {
      const date = attachment.date ?? '';
      const time = attachment.time ?? '';
      return `${attachment.title ?? 'Tour'}${date && time ? ` on ${date} at ${time}` : ''}`;
    }

    case 'roommate_invite':
      return `${attachment.inviterName ?? 'Someone'} invited you${attachment.hasExistingSlot ? ' to join their slot' : ''}`;

    case 'pod_join': {
      const seatInfo = `${attachment.seatNumber}/${attachment.totalSeats} seats`;
      return `${attachment.title ?? 'Pod Join'} - ${seatInfo}`;
    }

    case 'lodge_reservation':
      return `Applied for ${attachment.title ?? 'property'}`;

    case 'lodge_decision': {
      const decision = attachment.decision === 'accepted' ? 'approved' : 'rejected';
      return `Your application ${decision}${attachment.reason ? `: ${attachment.reason}` : ''}`;
    }

    default:
      return message.body || 'New message';
  }
};
