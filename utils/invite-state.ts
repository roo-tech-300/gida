import { holdCountdown } from '@/utils/property-bar-summary';

export type InviteStatus = 'open' | 'expired' | 'revoked' | 'claimed' | 'closed' | 'full' | 'not_found';

/** What a friend can do next when the link cannot be used. */
export type ProblemAction = 'ask-founder' | 'join-again' | 'browse' | 'open-my-spot' | 'none';

export type InviteProblem = { title: string; body: string; actionLabel: string; action: ProblemAction };

/** Copy for each way an invite link can be unusable. Null when the link is fine. */
export function inviteProblem(status: InviteStatus, inviter?: string | null): InviteProblem | null {
  const founder = inviter || 'your friend';
  switch (status) {
    case 'open':
      return null;
    case 'expired':
      return { title: 'This invite has expired', body: `Links work for 48 hours. Ask ${founder} to send you a new one.`, actionLabel: `Ask ${founder} for a new link`, action: 'ask-founder' };
    case 'revoked':
      return { title: 'This invite was cancelled', body: `${inviter ? `${inviter} cancelled` : 'It was cancelled'} this invite. You can ask for a new one.`, actionLabel: `Ask ${founder} for a new link`, action: 'ask-founder' };
    case 'claimed':
      return { title: 'This invite has already been used', body: `Each link holds one seat. Ask ${founder} for a link of your own.`, actionLabel: `Ask ${founder} for a new link`, action: 'ask-founder' };
    case 'full':
      return { title: 'This household is full', body: 'Every seat is taken or being held for someone else. Here are places that still have room.', actionLabel: 'See places with room', action: 'browse' };
    case 'closed':
      return { title: 'This household is no longer open', body: 'It was closed, so there is nothing to join. You can still look at other places.', actionLabel: 'See other places', action: 'browse' };
    case 'not_found':
    default:
      return { title: 'This link is not valid', body: 'It may have been copied incompletely. Ask your friend to send it again.', actionLabel: 'See places', action: 'browse' };
  }
}

/** Turns a failure from joining (the database's own words) into the matching dead-end screen. */
export function joinFailure(message: string | undefined): InviteProblem {
  const text = (message ?? '').toLowerCase();
  if (text.includes('unpaid spot')) {
    return { title: 'You already hold a spot', body: 'You can hold one unpaid spot at a time. Pay for it or cancel it to join this one.', actionLabel: 'Open my spot', action: 'open-my-spot' };
  }
  if (text.includes('ran out recently')) {
    return { title: 'Please wait a day', body: 'Two of your holds ran out recently, so new reservations are paused for a day.', actionLabel: 'See places', action: 'browse' };
  }
  if (text.includes('for women only') || text.includes('for men only')) {
    const who = text.includes('women') ? 'women' : 'men';
    return { title: `This household is for ${who} only`, body: `It is locked to ${who}, so you cannot join. You can still look at other places.`, actionLabel: 'See other places', action: 'browse' };
  }
  if (text.includes('already full') || text.includes('fully booked')) return inviteProblem('full') as InviteProblem;
  if (text.includes('expired')) return inviteProblem('expired') as InviteProblem;
  if (text.includes('already been used')) return inviteProblem('claimed') as InviteProblem;
  if (text.includes('cancelled')) return inviteProblem('revoked') as InviteProblem;
  if (text.includes('no longer open') || text.includes('no longer exists')) return inviteProblem('closed') as InviteProblem;
  if (text.includes('own invite')) {
    return { title: 'This is your own link', body: 'Send it to a friend. They open it to take a seat in your household.', actionLabel: 'Back to my place', action: 'open-my-spot' };
  }
  return { title: 'We could not add you', body: 'Something went wrong while joining. Please try the link again.', actionLabel: 'Try again', action: 'join-again' };
}

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

/** "Seat held for 1h 12m", or that the hold ended while the link still works. */
export function ghostSeatLabel(heldUntil: string, now: Date = new Date()): string {
  const left = new Date(heldUntil).getTime() - now.getTime();
  if (Number.isNaN(left) || left <= 0) return 'Seat released · link still works';
  const hours = Math.floor(left / HOUR_MS);
  const minutes = Math.floor((left % HOUR_MS) / MINUTE_MS);
  return hours > 0 ? `Seat held for ${hours}h ${minutes}m` : `Seat held for ${Math.max(minutes, 1)}m`;
}

/** "22h left to pay" for a friend who joined and has not paid. */
export function payTimeLeftLabel(deadline: string, now: Date = new Date()): string {
  const left = new Date(deadline).getTime() - now.getTime();
  if (Number.isNaN(left)) return '';
  if (left <= 0) return 'Time to pay has run out';
  const hours = Math.floor(left / HOUR_MS);
  return hours >= 1 ? `${hours}h left to pay` : 'Under 1h left to pay';
}

export { holdCountdown };
