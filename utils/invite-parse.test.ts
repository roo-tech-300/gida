import { initialsOf, parseInvitePage, parseSeats } from './invite-parse';

describe('parseInvitePage', () => {
  it('reads a full payload', () => {
    const page = parseInvitePage({
      status: 'open', title: 'Royal Lodge', location: 'Bosso, Minna', image: 'https://x/y.jpg', rent: '1200000.00', share: 300000, target: 4, joined: 2,
      openSeats: 1, gender: 'FEMALE', inviter: 'Ada', members: [{ initials: 'AO' }, { initials: 'TA' }], seatHeldUntil: '2026-11-14T09:00:00Z', expiresAt: '2026-11-16T07:00:00Z',
    });
    expect(page).toMatchObject({ status: 'open', rent: 1200000, share: 300000, openSeats: 1, gender: 'FEMALE', inviter: 'Ada', members: ['AO', 'TA'] });
  });

  it('treats anything unexpected as a link that was not found', () => {
    for (const bad of [null, undefined, 'x', [], {}, { status: 'weird' }]) expect(parseInvitePage(bad).status).toBe('not_found');
  });

  it('defaults a missing gender lock to open to everyone', () => {
    expect(parseInvitePage({ status: 'open' }).gender).toBe('ANY');
  });
});

describe('parseSeats', () => {
  it('reads members and live invites, and drops malformed invites', () => {
    const seats = parseSeats({
      target: 4,
      members: [{ name: 'Ada Okafor', isYou: true, state: 'review', deadline: null }, { name: 'Tobi', state: 'unpaid', deadline: '2026-11-15T00:00:00Z' }, { name: 'Amina', state: 'paid' }],
      invites: [
        { id: 'i1', token: 't1', openedAt: '2026-11-14T08:00:00Z', held: true, seatHeldUntil: '2026-11-14T09:00:00Z', expiresAt: '2026-11-16T07:00:00Z' },
        { id: 'i2', held: false },
      ],
    });
    expect(seats.target).toBe(4);
    expect(seats.members.map((m) => m.state)).toEqual(['review', 'unpaid', 'paid']);
    expect(seats.members[0].isYou).toBe(true);
    expect(seats.invites).toEqual([{ id: 'i1', token: 't1', opened: true, held: true, seatHeldUntil: '2026-11-14T09:00:00Z', expiresAt: '2026-11-16T07:00:00Z' }]);
  });

  it('survives an empty or broken payload', () => {
    expect(parseSeats(null)).toEqual({ target: 0, members: [], invites: [] });
  });
});

describe('initialsOf', () => {
  it('uses the first letters of the first two names', () => {
    expect(initialsOf('Tobi Adeyemi')).toBe('TA');
    expect(initialsOf('kemi')).toBe('K');
    expect(initialsOf('  ')).toBe('?');
  });
});
