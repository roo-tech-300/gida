import { ghostSeatLabel, inviteProblem, joinFailure, payTimeLeftLabel } from './invite-state';

const now = new Date('2026-11-14T12:00:00Z');
const at = (ms: number) => new Date(now.getTime() + ms).toISOString();
const HOUR = 3_600_000;

describe('inviteProblem', () => {
  it('has nothing to say about a usable link', () => {
    expect(inviteProblem('open')).toBeNull();
  });

  it('names the founder and offers a way out for every dead end', () => {
    expect(inviteProblem('expired', 'Ada')).toMatchObject({ title: 'This invite has expired', action: 'ask-founder' });
    expect(inviteProblem('expired', 'Ada')?.actionLabel).toBe('Ask Ada for a new link');
    expect(inviteProblem('expired')?.actionLabel).toBe('Ask your friend for a new link');
    expect(inviteProblem('full')).toMatchObject({ action: 'browse' });
    expect(inviteProblem('not_found')?.title).toBe('This link is not valid');
  });
});

describe('joinFailure', () => {
  it('maps the database wording to the right screen', () => {
    expect(joinFailure('You already hold an unpaid spot. Pay for it or cancel it first.')).toMatchObject({ title: 'You already hold a spot', action: 'open-my-spot' });
    expect(joinFailure('This household is for women only.').title).toBe('This household is for women only');
    expect(joinFailure('This household is for men only.').title).toBe('This household is for men only');
    expect(joinFailure('This group is already full. Pick another.').title).toBe('This household is full');
    expect(joinFailure('This place is fully booked.').action).toBe('browse');
    expect(joinFailure('Two of your holds ran out recently. Please wait a day.').title).toBe('Please wait a day');
    expect(joinFailure('This invite has expired.').title).toBe('This invite has expired');
    expect(joinFailure('This invite has already been used.').title).toBe('This invite has already been used');
    expect(joinFailure('This is your own invite link.').title).toBe('This is your own link');
  });

  it('falls back to a retry for anything unexpected', () => {
    expect(joinFailure('boom')).toMatchObject({ action: 'join-again' });
    expect(joinFailure(undefined).action).toBe('join-again');
  });
});

describe('seat clocks', () => {
  it('counts down a held seat, then says it was released', () => {
    expect(ghostSeatLabel(at(HOUR + 12 * 60_000), now)).toBe('Seat held for 1h 12m');
    expect(ghostSeatLabel(at(20 * 60_000), now)).toBe('Seat held for 20m');
    expect(ghostSeatLabel(at(-1000), now)).toBe('Seat released · link still works');
  });

  it('counts down the time a friend has left to pay', () => {
    expect(payTimeLeftLabel(at(22 * HOUR + 1000), now)).toBe('22h left to pay');
    expect(payTimeLeftLabel(at(30 * 60_000), now)).toBe('Under 1h left to pay');
    expect(payTimeLeftLabel(at(-1), now)).toBe('Time to pay has run out');
  });
});
