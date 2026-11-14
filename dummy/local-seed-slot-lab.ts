/**
 * "Slot lab": household and reservation data shaped to stress the slot economy rather than
 * the UI: partial fills, mixed payments, lapsed holds, multi-unit listings, odd splits, gender
 * locks, invitations, admin queue ages and parent pay links.
 *
 * `npm run db:slot-report` reads this data back and checks it against the rules the app relies on.
 * Each listing is named for the situation it holds; the table is in docs/local-dev.md.
 */
import type { SeedHousehold, SeedHouseholdMember, SeedListing, SeedUser } from './local-seed-data.ts';

const PREFIX = 'Slot · ';
const BOSSO_CAMPUS = 'FUT Minna, Bosso Campus';

const student = (key: string, fullName: string, gender: SeedUser['gender']): SeedUser => ({
  key, email: `${key}@gida.test`, fullName, username: key.replace('.', '_'), gender, onboarded: true,
});

export const SLOT_USERS: SeedUser[] = [
  ...Array.from({ length: 14 }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return student(`slot.${n}`, `Slot Student ${n}`, 'FEMALE');
  }),
  student('slot.m1', 'Slot Student M1', 'MALE'),
  student('slot.m2', 'Slot Student M2', 'MALE'),
];

const flat = (key: string, title: string, tier: number, price: number, extra: Partial<SeedListing> = {}): SeedListing => ({
  key, title: `${PREFIX}${title}`, landlord: 'alhaji', admin: 'field', layout: 'flat', priceTotal: price, bedrooms: Math.max(1, tier - 1),
  bathrooms: 1, maxRoommates: tier, landmark: 'Slot lab street', campus: BOSSO_CAMPUS, region: 'bosso', lat: 9.6502, lng: 6.5231,
  amenities: { borehole: true, fencedGate: true }, features: [], rules: ['Quiet hours 10pm to 6am'],
  description: 'A slot-lab listing: the interesting part is its household data, not the page.',
  photos: ['lodges/lodge-exterior.jpg', 'lodges/sitting-room.jpg', 'lodges/shared-kitchen.jpg'], ...extra,
});

export const SLOT_LISTINGS: SeedListing[] = [
  flat('sforming', 'Forming, 1 of 4', 4, 1200000),
  flat('smixed', 'Mixed payments, 3 of 4', 4, 1680000),
  flat('sfull', 'Full and paid, room assigned', 4, 1200000),
  flat('szombie', 'Lapsed hold still counted', 2, 600000),
  flat('smembers', 'Cancelled and expired members', 4, 1200000),
  flat('stwo', 'Two households, two units', 2, 700000, { units: 2 }),
  // Entered as ₦1,000,000; the rent is rounded up to ₦1,000,002 so three people pay ₦333,334 each.
  flat('sodd', 'Odd split, rent rounded up', 3, 1000000),
  flat('sgender', 'Gender-locked household', 2, 800000),
  flat('sinvites', 'Invitations', 3, 900000),
  flat('squeue', 'Admin queue ages', 1, 100000, { units: 4, layout: 'single_room', bedrooms: 0 }),
  flat('slinks', 'Parent pay links', 2, 640000, { units: 2 }),
  // A "just me" reservation pays the whole rent and takes the whole flat, so no spots are left.
  flat('sbuyout', 'Solo buyout of a 3-person flat', 3, 720000),
];

const m = (user: string, status: SeedHouseholdMember['status'], createdHoursAgo: number, extra: Partial<SeedHouseholdMember> = {}): SeedHouseholdMember =>
  ({ user, status, createdHoursAgo, ...extra });

const house = (key: string, listing: string, target: number, code: string, members: SeedHouseholdMember[], extra: Partial<SeedHousehold> = {}): SeedHousehold => ({
  key, listing, targetOccupancy: target, gender: 'FEMALE', verification: 'approved', groupCode: code, holdEndsInHours: 40, members, ...extra,
});

export const SLOT_HOUSEHOLDS: SeedHousehold[] = [
  house('s-forming', 'sforming', 4, 'SLFORM', [m('slot.01', 'booked_pending_claim', 20)], { invite: { invitee: 'sani', inviter: 'slot.01' } }),
  house('s-mixed', 'smixed', 4, 'SLMIXD', [
    m('slot.02', 'paid_unmatched', 60), m('slot.03', 'booked_pending_claim', 50, { holdEndsInHours: 30 }),
    m('slot.04', 'booked_pending_claim', 45, { holdEndsInHours: 5 }),
  ]),
  house('s-full', 'sfull', 4, 'SLFULL', [
    m('slot.05', 'paid_unmatched', 300), m('slot.06', 'paid_unmatched', 290), m('slot.07', 'paid_unmatched', 280), m('slot.08', 'paid_unmatched', 270),
  ], { finalized: true, room: 'B4', holdEndsInHours: 0 }),
  house('s-zombie', 'szombie', 2, 'SLZOMB', [
    m('slot.09', 'paid_unmatched', 120), m('slot.10', 'booked_pending_claim', 100, { holdEndsInHours: -6 }),
  ]),
  house('s-members', 'smembers', 4, 'SLMEMB', [
    m('slot.11', 'paid_unmatched', 150), m('slot.12', 'cancelled', 140), m('slot.13', 'expired', 130, { holdEndsInHours: -20 }),
    m('slot.14', 'booked_pending_claim', 120, { holdEndsInHours: 20 }),
  ]),
  house('s-two-a', 'stwo', 2, 'SLTWOA', [m('slot.05', 'paid_unmatched', 200), m('slot.06', 'paid_unmatched', 190)], { finalized: true, holdEndsInHours: 0 }),
  house('s-two-b', 'stwo', 2, 'SLTWOB', [m('slot.07', 'booked_pending_claim', 30, { holdEndsInHours: 25 })]),
  house('s-odd', 'sodd', 3, 'SLODD3', [
    m('slot.08', 'booked_pending_claim', 40, { holdEndsInHours: 30 }), m('slot.09', 'booked_pending_claim', 35, { holdEndsInHours: 30 }),
  ]),
  house('s-gender', 'sgender', 2, 'SLGEND', [m('slot.m1', 'booked_pending_claim', 25, { holdEndsInHours: 30 })], { gender: 'MALE' }),
  house('s-invites', 'sinvites', 3, 'SLINVT', [
    m('slot.10', 'booked_pending_claim', 50, { holdEndsInHours: 20 }), m('slot.11', 'booked_pending_claim', 45, { holdEndsInHours: 20 }),
  ], {
    invites: [
      { invitee: 'sani', inviter: 'slot.10', status: 'pending' },
      { invitee: 'halima', inviter: 'slot.10', status: 'declined' },
      { invitee: 'slot.11', inviter: 'slot.10', status: 'accepted' },
    ],
  }),
  ...[['slot.01', 0.2], ['slot.02', 5], ['slot.03', 30], ['slot.m1', 70]].map(([user, wait], i) => house(
    `s-queue-${i + 1}`, 'squeue', 1, `SLQUE${i + 1}`, [m(user as string, 'booked_pending_claim', wait as number, { holdEndsInHours: 72 - (wait as number) })],
    { verification: 'pending_verification', gender: i === 3 ? 'MALE' : 'FEMALE' },
  )),
  house('s-buyout', 'sbuyout', 1, 'SLBUYO', [m('slot.05', 'paid_unmatched', 50)], { finalized: true, holdEndsInHours: 0 }),
  house('s-links-a', 'slinks', 2, 'SLLNKA', [
    m('slot.12', 'booked_pending_claim', 30, { holdEndsInHours: 30, link: 'open' }), m('slot.13', 'booked_pending_claim', 28, { holdEndsInHours: 30, link: 'expired' }),
  ]),
  house('s-links-b', 'slinks', 2, 'SLLNKB', [
    m('slot.14', 'booked_pending_claim', 26, { holdEndsInHours: 30, link: 'revoked' }), m('slot.04', 'paid_unmatched', 24, { link: 'open' }),
  ]),
];
